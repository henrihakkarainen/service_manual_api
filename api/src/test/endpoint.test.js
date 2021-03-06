const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect

const baseURL = `http://localhost:${process.env.PORT || 3000}`

chai.use(chaiHttp)

describe('API endpoint unit tests', () => {
  let taskId;
  const newTaskBody = {
    description: 'Testing API endpoints with this task',
    priority: 'slight',
    mode: 'open',
    deviceid: 1
  }

  describe('POST-request to /api/tasks', () => {
    it('should create a new task if the input values are ok', (done) => {
      chai.request(baseURL)
        .post('/api/tasks')
        .send(newTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(201)
          expect(res.body).to.have.property('status')
          expect(res.body).to.have.property('data')
          expect(res.body.status).to.equal('success')
          expect(res.body.data.description).to.equal(newTaskBody.description)
          expect(res.body.data.priority).to.equal(newTaskBody.priority)
          expect(res.body.data.mode).to.equal(newTaskBody.mode)
          expect(res.body.data.deviceid).to.equal(newTaskBody.deviceid)
          taskId = res.body.data.taskid
          done()
        })
    })
  
    it('should return a 400 Bad Request when trying to create a task with missing input values', (done) => {
      const invalidTaskBody = {
        description: 'Creating this task should not succeed',
        mode: 'open',
        deviceid: 1
      }
  
      chai.request(baseURL)
        .post('/api/tasks')
        .send(invalidTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('error')
          done()
        })
    })
  
    it('should return a 400 Bad Request when trying to create a task with invalid input values', (done) => {
      const invalidTaskBody = {
        description: 'Creating this task should not succeed',
        priority: 'unknown',
        mode: 'open',
        deviceid: 1
      }
  
      chai.request(baseURL)
        .post('/api/tasks')
        .send(invalidTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('error')
          done()
        })
    })

    it('should return a 400 Bad Request when matching deviceid does not exist', (done) => {
      const invalidTaskBody = {
        description: 'Creating this task should not succeed',
        priority: 'important',
        mode: 'open',
        deviceid: 1111
      }
  
      chai.request(baseURL)
        .post('/api/tasks')
        .send(invalidTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('error')
          done()
        })
    })
  })

  describe('GET-request to /api/tasks', () => {
    it('should return list of all tasks when no query parameter is present', (done) => {
      chai.request(baseURL)
        .get('/api/tasks')
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.not.have.lengthOf(0)
          const task = res.body.find(item => item.taskid == taskId)
          expect(task).to.be.an('object')
          expect(task).to.have.property('deviceid')
          done()
        })
    })

    // This test needs some improvements to really check that only tasks of a single device are returned
    it('should return list of tasks of a single device filtered by query parameter', (done) => {
      chai.request(baseURL)
        .get(`/api/tasks?deviceId=${newTaskBody.deviceid}`)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.not.have.lengthOf(0)
          done()
        })
    })
  })

  describe('GET-request to /api/tasks/{taskid}', () => {
    it('should return a single task', (done) => {
      chai.request(baseURL)
        .get(`/api/tasks/${taskId}`)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.property('taskid')
          expect(res.body.taskid).to.equal(taskId)
          done()
        })
    })

    it('should return a 404 Not Found when no tasks matching the id parameter are found', (done) => {
      chai.request(baseURL)
        .get('/api/tasks/123')
        .end((err, res) => {
          expect(res).to.have.status(404)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('error')
          done()
        })
    })
  })

  describe('PUT-request to /api/tasks/{taskid}', () => {
    it('should update the given task when valid input is provided', (done) => {
      const updateTaskBody = {
        description: 'Updating the description',
        priority: 'important',
        mode: 'done'
      }

      chai.request(baseURL)
        .put(`/api/tasks/${taskId}`)
        .send(updateTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body).to.have.property('status')
          expect(res.body).to.have.property('data')
          expect(res.body.status).to.equal('success')
          expect(res.body.data.description).to.equal(updateTaskBody.description)
          expect(res.body.data.priority).to.equal(updateTaskBody.priority)
          expect(res.body.data.mode).to.equal(updateTaskBody.mode)
          done()
        })
    })

    it('should fail to update task and return 400 Bad Request when invalid input is provided', (done) => {
      const updateTaskBody = {
        description: 'Updating the description',
        priority: 'important',
        mode: 'unknown'
      }

      chai.request(baseURL)
        .put(`/api/tasks/${taskId}`)
        .send(updateTaskBody)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body).to.have.property('status')
          expect(res.body.status).to.equal('error')
          done()
        })
    })
  })

  describe('DELETE-request to /api/tasks/{taskid}', () => {
    it('should delete the given task', (done) => {
      chai.request(baseURL)
        .delete(`/api/tasks/${taskId}`)
        .end((err, res) => {
          expect(res).to.have.status(200)
          done()
        })
    })
  
    it('should return 404 when trying to delete task that does not exist', (done) => {
      chai.request(baseURL)
        .delete(`/api/tasks/${taskId}`)
        .end((err, res) => {
          expect(res).to.have.status(404)
          done()
        })
    })
  })
  
})