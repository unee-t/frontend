:root {
  --main-color: var(--strong-cerulean);
}
.theme1 {
  --main-color: var(--strong-cerulean);
}

.theme2 {
  --main-color: #9013FE;
}

.theme3 {
  --main-color: #D81159;
}

.theme4 {
  --main-color: #8F2D56;
}

.theme5 {
  --main-color: #FBB13C;
}

.theme6 {
  --main-color: #4B6858;
}

.theme7 {
  --main-color: #4D4730;
}

.theme8 {
  --main-color: #08605F;
}

.theme9 {
  --main-color: #8E936D;
}

.theme10 {
  --main-color: #A2AD59;
}

.userAvatar {
  background-color: var(--main-color);
}

.sized {
  &:not(.sizeSmall) {
    width: 2.5rem;
    height: 2.5rem;
    line-height: 2.5rem;
  }
  &.sizeSmall {
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
  }
}

.creatorText {
  color: var(--main-color);
}