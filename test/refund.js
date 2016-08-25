'use strict';

// DEADLINE_SECS: use value of 1 if testing againts testrpc, use a value of 30 seconds if testing against geth
const DEADLINE_SECS = 1

const GAS_CONTRIBUTE =  500000
const GAS_CREATE =     1000000

function waitMined(txnHash) {
  const interval =  1000
  const maxwait = 500000
  let counter = parseInt(maxwait / interval)
  return new Promise(function(resolve, reject) {
    let timer
    function check() {
      let receipt = web3.eth.getTransactionReceipt(txnHash)
      if (!receipt && --counter > 0) return
      clearInterval(timer)
      if (receipt) resolve(txnHash)
      else reject(txnHash + ' not mined within ' + maxwait + ' ms')
    }
    timer = setInterval(check, interval)
  })
}

contract('FundingHub', accounts => {
  let hub
  before(() => {
    hub = FundingHub.deployed()
  })
  describe('createProject()', () => {
    let filterNewProject
    afterEach(()=> {
      filterNewProject.stopWatching()
    })
    it('should emit event NewProject', (done) => {
      let createTxid
      function checkTxid(txid) {
        if (createTxid) {
          assert.equal(txid, createTxid)
          done()
        } else {
          createTxid = txid
        }
      }
      filterNewProject = hub.NewProject({owner: accounts[4]}, function (error, result) {
        if (error) return done(error)
        checkTxid(result.transactionHash)
      })
      const deadline =  Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)  // 7 days from now
      hub.createProject("test Project", "b9lab final project", "https://github.com/mpolci", web3.toWei(1), deadline, {from: accounts[4], gas: GAS_CREATE})
      .then(txid => checkTxid(txid))
      .catch(done)
    })
  })

  describe('contribute()', () => {
    let project
    beforeEach(done => {
      const deadline =  Math.floor(Date.now() / 1000) + DEADLINE_SECS
      hub.createProject("test Project", "b9lab final project", "https://github.com/mpolci", web3.toWei(1), deadline, {from: accounts[4], gas: GAS_CREATE})
      .then(txid => {
        let receipt = web3.eth.getTransactionReceipt(txid)
        // warning! trying to avoid a testrpc bug https://github.com/ethereumjs/testrpc/issues/146
        let gasUsed = web3.eth.getTransactionReceipt(txid).gasUsed || web3.eth.getTransactionReceipt(txid).cumulativeGasUsed
        if (gasUsed === GAS_CREATE) return done('Out of gas')
        const EVENT_SIGNATURE = web3.sha3('NewProject(address,address)')
        let log = receipt.logs.find(l => l.topics[0] === EVENT_SIGNATURE)
        if (!log) return done('No project created')
        project = Project.at('0x' + log.data.substr(-40))
        done()
      })
      .catch(done)
    })

    it('should contribute', () => {
      const AMOUNT = web3.toWei(0.1)
      let startingBalance = web3.eth.getBalance(accounts[1])
      let payedForGas
      return hub.contribute(project.address, {from: accounts[1], value: AMOUNT, gas: GAS_CONTRIBUTE})
      .then(txid => {
        // warning! trying to avoid a testrpc bug https://github.com/ethereumjs/testrpc/issues/146
        let gasUsed = web3.eth.getTransactionReceipt(txid).gasUsed || web3.eth.getTransactionReceipt(txid).cumulativeGasUsed
        assert.notEqual(gasUsed, GAS_CONTRIBUTE, 'Out of gas')
        payedForGas = web3.eth.getTransaction(txid).gasPrice.mul(gasUsed)
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
        hub.contribute(project.address, {from: accounts[1], value: contribs[1], gas: GAS_CONTRIBUTE}),
        hub.contribute(project.address, {from: accounts[2], value: contribs[2], gas: GAS_CONTRIBUTE}),
        hub.contribute(project.address, {from: accounts[3], value: contribs[3], gas: GAS_CONTRIBUTE}),
      ])
      .then(txs => Promise.all(txs.map(waitMined)))  // redundant with truffle 2
      .then(() => {
        for (let i=1; i<=4; i++)
          balances[i] = web3.eth.getBalance(accounts[i])
      })
      .then(() => new Promise(function(resolve, reject) {
        setTimeout(resolve, DEADLINE_SECS * 1000);
      }))
      .then(() => hub.contribute(project.address, {from: accounts[4], value: web3.toWei(0.4), gas: GAS_CONTRIBUTE}))
      .then(txid => waitMined(txid))  // redundant with truffle 2
      .then(txid => {
        // warning! trying to avoid a testrpc bug https://github.com/ethereumjs/testrpc/issues/146
        let gasUsed = web3.eth.getTransactionReceipt(txid).gasUsed || web3.eth.getTransactionReceipt(txid).cumulativeGasUsed
        assert.notEqual(gasUsed, GAS_CONTRIBUTE, 'Out of gas')
        let gasPrice = web3.eth.getTransaction(txid).gasPrice
        let actualBalances = []
        for (let i=1; i<=4; i++)
          actualBalances[i] = web3.eth.getBalance(accounts[i])

        assert.equal(balances[4].minus(actualBalances[4]).toString(), gasPrice.mul(gasUsed).toString(), 'last contribute should coming back')
        assert.equal(actualBalances[1].minus(balances[1]).toString(), contribs[1], 'account 1 refunded')
        assert.equal(actualBalances[2].minus(balances[2]).toString(), contribs[2], 'account 2 refunded')
        assert.equal(actualBalances[3].minus(balances[3]).toString(), contribs[3], 'account 3 refunded')
        assert.equal(web3.eth.getBalance(project.address).toNumber(), 0, 'project balance')
      })
      .then(() => project.status.call())
      .then(status => assert.equal(status.toNumber(), 2, 'status refunded'))
    })

  })
})
