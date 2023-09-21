import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

const appSettings = {
  databaseURL:
    "<Place Holder for your firebase database URL>",
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const endorsementInDB = ref(database, "endorsementDB");

const commentsEl = document.querySelector(".comments");
const endorsementForm = document.querySelector(".endorsement-form");

endorsementForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const endorsementFormData = new FormData(endorsementForm);

  let endorsementComment = endorsementFormData.get("endorsement-input");
  let endorsementTo = endorsementFormData.get("endorsement-to");
  let endorsementFrom = endorsementFormData.get("endorsement-from");
  let endorsementLikes = 0;

  const dataToPush = {
    comments: endorsementComment,
    from: endorsementFrom,
    to: endorsementTo,
    likes: endorsementLikes,
    timestamp: new Date().toISOString(),
  };
  push(endorsementInDB, dataToPush);
  endorsementForm.reset();
});

onValue(endorsementInDB, function (snapshot) {
  clearComments();
  if (snapshot.exists()) {
    let itemArray = Object.entries(snapshot.val());
    // console.log(itemArray[1][0]);
    for (let i = 0; i < itemArray.length; i++) {
      buildCommentsList(
        itemArray[i][0],
        itemArray[i][1].comments,
        itemArray[i][1].to,
        itemArray[i][1].from,
        itemArray[i][1].likes,
      );
    }
  }
  // showComments();
});

function clearComments() {
  commentsEl.innerHTML = "";
}

function buildCommentsList(id, comments, to, from, likes) {
  const listToEl = document.createElement("p");
  const listFromEl = document.createElement("p");
  const listContentEl = document.createElement("p");
  const listBlockEl = document.createElement("div");
  const listFromLikeEl = document.createElement("div");
  const listCountLikeEl = document.createElement("div");
  const listIconEl = document.createElement("p");
  const listCountEl = document.createElement("p");
  // add the classes

  listBlockEl.classList.add("list-block");
  listToEl.classList.add("list-to", "list-header-footer");
  listContentEl.classList.add("list-content");
  listFromLikeEl.classList.add("list-from-like");
  listFromEl.classList.add("list-from", "list-header-footer");
  listCountLikeEl.classList.add("list-count-like");
  listIconEl.classList.add("icon");
  listCountEl.classList.add("count");

  //set the content
  listToEl.textContent = to;
  listContentEl.textContent = comments;
  listFromEl.textContent = from;
  listIconEl.textContent = "❤️";
  listCountEl.textContent = likes;
  listIconEl.disabled = true;

  // Check localStorage for this particular ID
  if (localStorage.getItem(id)) {
    listIconEl.style.pointerEvents = "none";
    listIconEl.style.opacity = "0.4";
  }

  listIconEl.addEventListener("click", function () {
    if (localStorage.getItem(id)) {
      return; // If the ID exists in localStorage, do nothing (icon was already clicked)
    }
    // Get a reference to the specific endorsement you want to update
    const specificEndorsementRef = ref(database, `endorsementDB/${id}`);

    // Use a transaction to safely increment the likes field
    runTransaction(specificEndorsementRef, (currentData) => {
      if (currentData === null) {
        return { likes: 1 }; // if data is null (i.e., doesn't yet exist), initialize it
      } else {
        currentData.likes += 1; // otherwise, increment the current likes count by 1
        return currentData; // return the whole object to avoid overwriting
      }
    })
      .then(() => {
        listCountEl.textContent = Number(listCountEl.textContent) + 1;
      })
      .catch((error) => {
        console.error("Transaction failed: ", error);
      });
    localStorage.setItem(id, true);

    // Optionally disable the icon
    listIconEl.style.pointerEvents = "none";
    listIconEl.style.opacity = "0.5";
  });

  // assemble the structure
  listBlockEl.appendChild(listToEl);
  listBlockEl.appendChild(listContentEl);
  listFromLikeEl.appendChild(listFromEl);
  listCountLikeEl.appendChild(listIconEl);
  listCountLikeEl.appendChild(listCountEl);
  listFromLikeEl.appendChild(listCountLikeEl);
  listBlockEl.appendChild(listFromLikeEl);
  if (commentsEl.firstChild) {
    commentsEl.insertBefore(listBlockEl, commentsEl.firstChild);
  } else {
    commentsEl.appendChild(listBlockEl);
  }
}
