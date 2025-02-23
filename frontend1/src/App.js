import React, { useState } from "react"
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  useMutation,
  gql,
} from "@apollo/client"

// Initialize Apollo Client
const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
})

// GraphQL Queries and Mutations
const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      id
      name
    }
  }
`

const GET_STUDENTS_BY_DEPARTMENT = gql`
  query GetStudentsByDepartment($departmentId: ID!) {
    studentsByDepartment(departmentId: $departmentId) {
      id
      first_name
      last_name
      student_id
      address
      department {
        name
      }
    }
  }
`

const ADD_STUDENT = gql`
  mutation AddStudent(
    $first_name: String!
    $last_name: String!
    $student_id: String!
    $address: String!
    $department_id: ID!
  ) {
    addStudent(
      first_name: $first_name
      last_name: $last_name
      student_id: $student_id
      address: $address
      department_id: $department_id
    ) {
      id
      first_name
      last_name
    }
  }
`

function DepartmentSelector({ setDepartmentId }) {
  const { loading, error, data } = useQuery(GET_DEPARTMENTS)

  if (loading) return <p>Loading departments...</p>
  if (error) return <p>Error fetching departments</p>

  return (
    <select onChange={(e) => setDepartmentId(e.target.value)}>
      <option value="">Select Department</option>
      {data.departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name}
        </option>
      ))}
    </select>
  )
}

function StudentList({ departmentId }) {
  const { loading, error, data, refetch } = useQuery(
    GET_STUDENTS_BY_DEPARTMENT,
    {
      variables: { departmentId },
      skip: !departmentId,
    }
  )

  if (!departmentId) return <p>Please select a department</p>
  if (loading) return <p>Loading students...</p>
  if (error) return <p>Error fetching students: {error.message}</p>

  return (
    <>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Student ID</th>
            <th>Address</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {data.studentsByDepartment.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.first_name}</td>
              <td>{student.last_name}</td>
              <td>{student.student_id}</td>
              <td>{student.address}</td>
              <td>{student.department.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddStudent departmentId={departmentId} refetchStudents={refetch} />
    </>
  )
}

function AddStudent({ departmentId, refetchStudents }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    student_id: "",
    address: "",
    department_id: departmentId || "",
  })

  const { loading, error, data } = useQuery(GET_DEPARTMENTS)
  const [addStudent] = useMutation(ADD_STUDENT)

  if (loading) return <p>Loading departments...</p>
  if (error) return <p>Error loading departments</p>

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Ensure department_id comes from the form selection
    if (!formData.department_id) {
      alert("Please select a department before adding the student.")
      return
    }

    await addStudent({
      variables: {
        ...formData,
        department_id: formData.department_id,
      },
    })

    alert("Student Added Successfully!")

    refetchStudents()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="First Name"
        onChange={(e) =>
          setFormData({ ...formData, first_name: e.target.value })
        }
        required
      />
      <input
        type="text"
        placeholder="Last Name"
        onChange={(e) =>
          setFormData({ ...formData, last_name: e.target.value })
        }
        required
      />
      <input
        type="text"
        placeholder="Student ID"
        onChange={(e) =>
          setFormData({ ...formData, student_id: e.target.value })
        }
        required
      />
      <input
        type="text"
        placeholder="Address"
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        required
      />

      {/* Department Selection Dropdown */}
      <select
        value={formData.department_id}
        onChange={(e) =>
          setFormData({ ...formData, department_id: e.target.value })
        }
        required
      >
        <option value="">Select Department</option>
        {data.departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>

      <button type="submit">Add Student</button>
    </form>
  )
}

function App() {
  const [departmentId, setDepartmentId] = useState("")

  return (
    <ApolloProvider client={client}>
      <DepartmentSelector setDepartmentId={setDepartmentId} />
      <StudentList departmentId={departmentId} />
    </ApolloProvider>
  )
}

export default App
