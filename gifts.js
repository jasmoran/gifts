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

function sortBy (uid, claimedBy) {
  if (claimedBy === uid) return 0
  if (!claimedBy) return 1
  return 2
}

function renderGift (gift) {
  if (!gift.title || gift.ignore) return '';
  
  var innerHTML = ''
  innerHTML += '<div class="column col-6 col-xs-12"><div class="card"><div class="card-image"><img class="img-responsive p-centered" style="max-height: 250px;" src="'
  innerHTML += gift.image || './gift.png'
  innerHTML += '"></div><div class="card-header"><div class="card-title h5">'
  innerHTML += gift.title
  innerHTML += '</div></div><div class="card-body">'
  innerHTML += gift.description || ''
  if (gift.links) {
    innerHTML += '<div class="navbar-section"><br /><div class="h6">Ideas</div>'
    gift.links.forEach(function (link) {
      innerHTML += '<a class="btn btn-link" href="' + link.url + '">' + link.text + '</a>'
    })
    innerHTML += '</div>'
  }
  innerHTML += '</div>'

  if (gift.claimable) {
    innerHTML += '<div class="card-footer">'
    switch (gift.claim) {
      case 'self':
        innerHTML += '<b>You are getting this</b><div class="btn btn-primary float-right" onClick="unclaim(\''
        innerHTML += gift.id
        innerHTML += '\')">Changed your mind?</div>'
        break;
      case 'none':
        innerHTML += '<div class="btn btn-primary" onClick="claim(\''
        innerHTML += gift.id
        innerHTML += '\')">I’ll get this</div>'
        break;
      case 'other':
        innerHTML += '<b>Someone else is getting this</b>'
        break;
    }
    innerHTML += '</div>'
  }

  innerHTML += '</div></div>'

  return innerHTML
}

function render () {
  if (!gifts || !claims) return

  var uid = auth.currentUser ? auth.currentUser.uid : null;

  var selfClaimed = []
  var unclaimed = []
  var otherClaimed = []
  gifts.sort(function (b, a) { return b.title.localeCompare(a.title) })
  gifts.forEach(function (gift) {
    var claimedBy = claims[gift.id]
    if (claimedBy === uid) {
      gift.claim = 'self'
      selfClaimed.push(gift)
    } else if (!claimedBy) {
      gift.claim = 'none'
      unclaimed.push(gift)
    } else {
      gift.claim = 'other'
      otherClaimed.push(gift)
    }
  })

  var innerHTML = ''
  selfClaimed.forEach(function (gift) { innerHTML += renderGift(gift) })
  innerHTML += '<div class="column col-6 col-xs-12"><div class="card"><div class="card-image"><img class="img-responsive p-centered" style="max-height: 250px;" src="https://www.aucklandcitymission.org.nz/wp-content/uploads/2015/12/logo.png"></div><div class="card-header"><div class="card-title h5">Donate to Auckland City Mission</div></div><div class="card-body">Donate an amount in our name to Auckland City Mission</div><div class="card-footer"><a class="btn btn-primary" href="https://www.aucklandcitymission.org.nz/support-us">Donate</a></div></div></div>'
  innerHTML += '<div class="column col-6 col-xs-12"><div class="card"><div class="card-image"><img class="img-responsive p-centered" style="max-height: 250px;" src="https://www.aunties.co.nz/wp-content/uploads/2020/01/new-aunties-logo.jpg"></div><div class="card-header"><div class="card-title h5">Donate to The Aunties</div></div><div class="card-body">Donate an amount in our name to The Aunties</div><div class="card-footer"><a class="btn btn-primary" href="https://www.aunties.co.nz/donate/">Donate</a></div></div></div>'
  unclaimed.forEach(function (gift) { innerHTML += renderGift(gift) })
  otherClaimed.forEach(function (gift) { innerHTML += renderGift(gift) })

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
