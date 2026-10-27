

const User = require("./User");
const Stream = require("./Stream");
const Subject = require("./Subject");

Stream.hasMany(Subject, {
  foreignKey: "streamId",
  as: "subjects"
});

Subject.belongsTo(Stream, {
  foreignKey: "streamId",
  as: "stream"
});

User.hasMany(Subject, {
  foreignKey: "createdBy",
  as: "createdSubjects"
});

Subject.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator"
});

module.exports = {
  User,
  Stream,
  Subject
};
