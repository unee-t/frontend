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

.section {
  display: flex;
  border: 1px solid lightskyblue;
  padding: 0.25rem;
  margin-bottom: 1px;

  & > * {
    margin: 0.25rem;
  }

  & > :not(.itemFlow) {
    flex-basis: fit-content;
  }

  & > .itemFlow {
    flex: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

.dependenciesDetails {
  display: flex;

  & .labels {
    text-align: right;
    margin-right: 5px;
  }
}

.dependencyTreeAccess {
  display: flex;

  & .label {
    text-align: right;
    margin-right: 5px;
  }
}

