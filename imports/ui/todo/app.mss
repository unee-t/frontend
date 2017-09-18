.container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100%;
  background: white;
}

.header {
  background: #d2edf4;
  background-image: linear-gradient(to bottom, #d0edf5, #e1e5f0 100%);
  padding: 20px 15px 15px 15px;
  position: relative;
  .hideCompleted {
    float: right;
  }
}

#login-buttons {
  display: block;
}

.title {
  font-size: 1.5em;
  margin: 0;
  margin-bottom: 10px;
  display: inline-block;
  margin-right: 1em;
}

.newTask {
  margin-top: 10px;
  margin-bottom: -10px;
  position: relative;

  input {
    box-sizing: border-box;
    padding: 10px 0;
    background: transparent;
    border: none;
    width: 100%;
    padding-right: 80px;
    font-size: 1em;
    &:focus {
      outline: 0;
    }
  }
}

.list {
  margin: 0;
  padding: 0;
  background: white;
}

.delete {
  float: right;
  font-weight: bold;
  background: none;
  font-size: 1em;
  border: none;
  position: relative;
}

.listItem {
  position: relative;
  list-style: none;
  padding: 15px;
  border-bottom: #eee solid 1px;
  .text {
    margin-left: 10px;
  }
  .checked {
    color: #888;
  }
  .checked .text {
    text-decoration: line-through;
  }
  .private {
    background: #eee;
    border-color: #ddd;
  }
}

.togglePrivate {
  margin-left: 5px;
}

@media (max-width: 600px) {
  .listItem {
    padding: 12px 15px;
  }

  .search {
    width: 150px;
    clear: both;
  }

  .newTask input {
    padding-bottom: 5px;
  }
}

