const generateMessage = (username = "User", text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
};
