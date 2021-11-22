const socket = io();
const form = document.querySelector("#send_message");
const sendLocation = document.querySelector("#send-location");
const messageFormInput = form.querySelector("input");
const messageFormButton = form.querySelector("button");
const messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
    const newMessage = messages.lastElementChild;

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messages.offsetHeight;
    const containerHeight = messages.scrollHeight;

    const scrollOffset = messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
}


socket.on("message", ({ username, text: message, createdAt: time } = {}) => {
  const html = Mustache.render(messageTemplate, {
    time: moment(time).format("HH:mm:ss"),
    message,
    username,
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on(
  "locationMessage",
  ({ username, text: url, createdAt: time } = {}) => {
    const html = Mustache.render(locationTemplate, {
      time: moment(time).format("HH:mm:ss"),
      url,
      username,
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (message) => {
    messageFormButton.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();
  });
});

sendLocation.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return console.log("Geolocation is not supported by your browser");
  }

  sendLocation.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (message) => {
        sendLocation.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

// socket.on('countUpdated', (count) => {
//     console.log(count)
// });

// document.querySelector('#increment').addEventListener('click', (e) => {
//     socket.emit('increment');
// });
