// Hello visitor, I know this code is terrible.
// I don't have the time to make it any fancier.
// Feel free to send me a pull request (https://github.com/jasmoran/gifts)

var cards = document.getElementById('cards')
var login = document.getElementById('login')
var giftsCollection = db.collection('gifts')
var claimsCollection = db.collection('claims')
var gifts = null
var claims = null

giftsCollection.onSnapshot(function (querySnapshot) {
  console.log('Gifts changed')

  var newGifts = []
  querySnapshot.forEach(function (doc) {
    var gift = doc.data()
    gift.id = doc.id
    newGifts.push(gift)
  })
  gifts = newGifts

  render()
})

claimsCollection.onSnapshot(function (querySnapshot) {
  console.log('Claims changed')

  var newClaims = {}
  querySnapshot.forEach(function (doc) {
    newClaims[doc.id] = doc.get('user_id')
  })
  claims = newClaims

  render()
})

auth.onAuthStateChanged(function(user) {
  if (user) {
    login.style.display = 'none'
    cards.style.display = ''
  } else {
    login.style.display = ''
    cards.style.display = 'none'
  }
});

function render () {
  if (!gifts || !claims) return

  var uid = auth.currentUser ? auth.currentUser.uid : null;

  var innerHTML = ''
  gifts.forEach(function (gift) {
    var claimedBy = claims[gift.id]

    if (!gift.title) return;
    if (claimedBy && claimedBy !== uid && gift.claimable) return;

    innerHTML += '<div class="column col-6 col-xs-12"><div class="card"><div class="card-image"><img class="img-responsive p-centered" style="max-height: 250px;" src="'
    innerHTML += gift.image || './gift.png'
    innerHTML += '"></div><div class="card-header"><div class="card-title h5">'
    innerHTML += gift.title
    innerHTML += '</div></div><div class="card-body">'
    innerHTML += gift.description || ''
    innerHTML += '</div>'
    if (gift.claimable) {
      if (claimedBy) {
        innerHTML += '<div class="card-footer"><b>You are getting this</b><div class="btn btn-primary float-right" onClick="unclaim(\''
        innerHTML += gift.id
        innerHTML += '\')">Changed your mind?</div></div>'
      } else {
        innerHTML += '<div class="card-footer"><div class="btn btn-primary" onClick="claim(\''
        innerHTML += gift.id
        innerHTML += '\')">I’ll get this</div></div>'
      }
    }
    innerHTML += '</div></div>'
  })

  if (cards.innerHTML !== innerHTML) {
    cards.innerHTML = innerHTML
    console.log('Re-rendered')
  }
}

function claim (id) {
  db.collection('claims')
    .doc(id)
    .set({
      user_id: auth.currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function () {
      console.log('Claimed', id)
    }).catch(function (error) {
      console.log('Claim failed!', id, error)
    })
}

function unclaim (id) {
  db.collection('claims')
    .doc(id)
    .delete()
    .then(function () {
      console.log('Unclaimed', id)
    }).catch(function (error) {
      console.log('Unclaim failed!', id, error)
    })
}
