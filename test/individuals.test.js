var request = require("supertest");
var assert = require("chai").assert;
var app = require("../scoring");
var agent = request.agent(app);

before(function() {        
  return new Promise((resolve,reject) => {
    app.on("listening", function() {
      return resolve();
    }); 
  });
});

describe("Add config",function() {
  it("Add a new connection",function(done) {
    agent
      .get("/models/scoring/individuals")
      .expect(200)
      .expect("Config successfully added", done);
  });
});