const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const Person = require('./models/person')
app.use(express.static('build'))
app.use(cors())
app.use(express.json())
morgan.token('body', (req) => { // res removed
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/api/persons', (req, res, next) => {
  Person.find({})
    .then(persons => {
      res.json(persons)
    })
    .catch(error => next(error))
})

app.get('/api/info', (req, res) => {
  Person.find({})
    .then(persons => {
      res.send(
        `<div>Phonebook has information about ${persons.length} persons. <br></br> ${new Date()}</div>`
      )
    })

})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(res.status(204).end())
    .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body
  if (body === undefined || !body.name || !body.number) {
    return res.status(400).json({ error: 'content missing' })
  }

  Person.find({})
    .then(persons => {
      return persons.map(person => person.name)
    })
    .then(names => {
      if (names.find(name => name === body.name)) {
        return res.status(400).json({ error: 'name is in phonebook already' })
      } else {
        const person = new Person({
          name: body.name,
          number: body.number
        })
        person.save().then(savedPerson => {
          res.json(savedPerson)
        })
          .catch(error => next(error))
      }
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body
  if (body === undefined) {
    return res.status(400).json({ error: 'content missing' })
  }
  const person = {
    name: body.name,
    number: body.number,
    id: body.id
  }
  Person.findByIdAndUpdate(req.params.id, person, { new: true })
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'incorrect id format' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json(Object.values(error.errors).map(val => val.message))
  }
  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
