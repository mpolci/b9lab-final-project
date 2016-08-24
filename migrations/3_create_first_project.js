'use strict'

module.exports = function(deployer) {
  const NAME = "First Project"
  const DESC = "B9lab X16-1 final project"
  const URL = "https://github.com/mpolci/b9lab-final-project"
  const TARGET = web3.toWei(10)
  const DEADLINE =  Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)  // 7 days from now

  let hub = FundingHub.deployed()
  let createTx

  deployer
  .then(() => hub.createProject(NAME, DESC, URL, TARGET, DEADLINE))
  .then(txid => createTx = txid)
  // ferify project creation by checking the NewProject event
  .then(() => new Promise(function(resolve, reject) {
    deployer.logger.log('Create project transaction: ' + createTx)
    getCreatedProject(createTx, (err, prjAddr) => {
      if (err) return reject(err)
      deployer.logger.log('New project at address: ' + prjAddr)
      resolve()
    })
  }))

  function getCreatedProject(txid, callback) {
    const EVENT_SIGNATURE = web3.sha3('NewProject(address,address)')
    web3.eth.getTransactionReceipt(txid, (err, receipt) => {
      if (err) return callback(err)
      if (!receipt) return callback('transaction not found')
      let log = receipt.logs.find(l => l.topics[0] === EVENT_SIGNATURE)
      if (!log) return callback('No project created')
      let addr = '0x' + log.data.substr(-40)
      callback(null, addr)
    })
  }

}
