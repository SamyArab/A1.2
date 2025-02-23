const express = require("express")
const { ApolloServer, gql } = require("apollo-server-express")
const sqlite3 = require("sqlite3").verbose()
const { open } = require("sqlite")

let db
;(async () => {
  db = await open({
    filename: "./studentsinfo.sqlite",
    driver: sqlite3.Database,
  })
})()

// GraphQL Schema
const typeDefs = gql`
  type Department {
    id: ID
    name: String
    address: String
  }

  type Student {
    id: ID!
    first_name: String!
    last_name: String!
    student_id: String!
    address: String!
    department: Department
  }

  type Query {
    studentsByDepartment(departmentId: ID!): [Student]
    departments: [Department]
  }

  type Mutation {
    addStudent(
      first_name: String!
      last_name: String!
      student_id: String!
      address: String!
      department_id: ID!
    ): Student
  }
`

const resolvers = {
  Query: {
    studentsByDepartment: async (_, { departmentId }) => {
      const students = await db.all(
        `SELECT students.id AS id, students.first_name, students.last_name, 
                students.student_id, students.address, 
                departments.id AS department_id, 
                departments.name AS department_name, 
                departments.address AS department_address 
         FROM students 
         LEFT JOIN departments ON students.department_id = departments.id 
         WHERE students.department_id = ?`,
        [departmentId]
      )

      return students.map((student) => ({
        id: String(student.id),
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        address: student.address,
        department: student.department_id
          ? {
              id: String(student.department_id),
              name: student.department_name || "Unknown Department",
              address: student.department_address || "Unknown Address",
            }
          : null,
      }))
    },

    departments: async () => {
      return await db.all("SELECT id, name, address FROM departments")
    },
  },

  Mutation: {
    addStudent: async (
      _,
      { first_name, last_name, student_id, address, department_id }
    ) => {
      const result = await db.run(
        "INSERT INTO students (first_name, last_name, student_id, address, department_id) VALUES (?, ?, ?, ?, ?)",
        [first_name, last_name, student_id, address, department_id]
      )

      const newStudent = await db.get("SELECT last_insert_rowid() as id")

      return {
        id: String(newStudent.id),
        first_name,
        last_name,
        student_id,
        address,
        department: { id: String(department_id) },
      }
    },
  },
}

async function startServer() {
  const app = express()
  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()
  server.applyMiddleware({ app })

  app.listen({ port: 4000 }, () =>
    console.log("Server ready at http://localhost:4000/graphql")
  )
}

startServer()
