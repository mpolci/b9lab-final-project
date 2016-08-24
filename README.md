# B9lab X16-1 final project - Marco Polci

Source: https://github.com/mpolci/b9lab-final-project

# Start
Activate a local ethereum node with rpc service at http://localhost:8545, can be used both geth or testrpc, then simply deploy the contracts and run the web user interface:
```
truffle migrate
truffle serve
```
then open the browser at http://localhost:8080

# Notes on smart contracts
The **FundingHub** stores the deploying account address as *maintainer* of the hub. It's role is to manually resolve errors in the ethers transfers. For simplicity of the implementation, when a **Project** contract do a refund or a payout and an ethers transfer fails, it forward unsent amount to the FundingHub so the maintainer can manually manage this funds. It is a centralized solution just to address error cases.

# Tests
You can run test against testrpc or geth. To use geth you must increase the constant
`DEADLINE_SECS` in the file *test/refund.js*.
