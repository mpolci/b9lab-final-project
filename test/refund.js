'use strict';

function shouldFail(promise) {
  return new Promise((resolve, reject) => {
    promise
    .then(() => reject('testrpc should fail'))
    .catch(() => resolve())
  })
}

contract('FundingHub', accounts => {
  let hub
  before(() => {
    hub = FundingHub.deployed()
  })
  describe('createProject', () => {
    let filterNewProject
    afterEach(()=> {
      filterNewProject.stopWatching()
    })
    it('should emit event NewProject', (done) => {
      let createTxid
      filterNewProject = hub.NewProject({owner: accounts[0]}, function (error, result) {
        if (error) return done(error)
        assert.equal(result.transactionHash, createTxid)
        // console.log(result)
        done()
      })
      const deadline =  Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)  // 7 days from now
      hub.createProject("test Project", "b9lab final project", "https://github.com/mpolci", web3.toWei(1), deadline, {from: accounts[0]})
      .then(txid => createTxid = txid)
      .catch(done)
    })
  })

  describe('contribute', () => {
    let project
    beforeEach(done => {
      let filter
      let _done = (err) => {
        filter.stopWatching()
        done()
      }
      let createTxid
      filter = hub.NewProject({owner: accounts[0]}, function (error, result) {
        if (error) return _done(error)
        if (result.transactionHash === createTxid) {
          project = Project.at(result.args.project)
          _done()
        }
      })
      const deadline =  Math.floor(Date.now() / 1000) + 1  // 1 second from now
      hub.createProject("test Project", "b9lab final project", "https://github.com/mpolci", web3.toWei(1), deadline, {from: accounts[0]})
      .then(txid => createTxid = txid)
      .catch(_done)
    })

    it('should contribute', () => {
      const AMOUNT = web3.toWei(0.1)
      let startingBalance = web3.eth.getBalance(accounts[1])
      let payedForGas
      return hub.contribute(project.address, {from: accounts[1], value: AMOUNT})
      .then(txid => {
        payedForGas = web3.eth.getTransactionReceipt(txid).gasUsed * web3.eth.getTransaction(txid).gasPrice
      })
      .then(() => project.contributionOf.call(accounts[1]))
      .then(contribution => {
        assert.equal(contribution.toNumber(), AMOUNT, 'contribution amount')
        assert.equal(web3.eth.getBalance(project.address).toNumber(), AMOUNT, 'project balance')
        let actualBalance = web3.eth.getBalance(accounts[1])
        assert.equal(startingBalance.minus(actualBalance).minus(payedForGas).toNumber(), AMOUNT, 'transfered ethers')
      })
    })

    it('should refund', () => {
      const contribs = [0, web3.toWei(0.1), web3.toWei(0.2), web3.toWei(0.3)]
      let balances = []
      return Promise.all([
        hub.contribute(project.address, {from: accounts[1], value: contribs[1]}),
        hub.contribute(project.address, {from: accounts[2], value: contribs[2]}),
        hub.contribute(project.address, {from: accounts[3], value: contribs[3]}),
      ])
      .then(() => {
        for (let i=0; i<=3; i++)
          balances[i] = web3.eth.getBalance(accounts[i]).toNumber()
      })
      .then(() => new Promise(function(resolve, reject) {
        setTimeout(resolve, 1000);
      }))
      .then(() => hub.contribute(project.address, {from: accounts[0], value: web3.toWei(0.4)}))
      .then(txid => {
        let gasUsed = web3.eth.getTransactionReceipt(txid).gasUsed
        let gasPrice = web3.eth.getTransaction(txid).gasPrice
        let actualBalances = []
        for (let i=0; i<=3; i++)
          actualBalances[i] = web3.eth.getBalance(accounts[i]).toNumber()

        assert.equal(actualBalances[0] + (gasUsed * gasPrice), balances[0], 'last contribute should coming back')
        assert.equal(actualBalances[1] - balances[1], contribs[1], 'account 1 refunded')
        assert.equal(actualBalances[2] - balances[2], contribs[2], 'account 2 refunded')
        assert.equal(actualBalances[3] - balances[3], contribs[3], 'account 3 refunded')
        assert.equal(web3.eth.getBalance(project.address).toNumber(), 0, 'project balance')
      })
      .then(() => project.status.call())
      .then(status => assert.equal(status.toNumber(), 2, 'status refunded'))
    })

  })
})
