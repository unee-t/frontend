.container {
  padding: 0.5rem;
  background-color: #fdfdfd;
  border-radius: 2px;
  width: 800px;
  margin: auto;

  @media screen(max-width: 768px) {
    width: 100%;
  }
}

:root {
  --creator-color: #2682A0;
}

.messagesContainer {
  background-color: #f0f0f0;
}

.messageBox {
  max-width: 60%;
}

.messageCreator {
  color: var(--creator-color);
}

.messageAvatar {
  background-color: var(--creator-color);
  width: 2.5rem;
  height: 2.5rem;
  line-height: 2.5rem;
}

.messageTime {
  color: #a4a4a4;
  line-height: 1.5rem;
}

.inputRow {
  background-color: #ddd;
  height: 3rem;
}
