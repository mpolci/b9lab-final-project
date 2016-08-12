contract Project {

  address public hub;
  address public owner;
  string public name;
  string public description;
  string public url;
  uint public targetAmount;
  uint public deadline;
  uint public collectedFunds;
  uint public status; // 0: in progress - 1: payed out - 2: refunded

  struct Contributor {
    uint amount;
    uint index;
  }
  /*mapping (address => uint) public contribution;*/
  mapping (address => Contributor) contributorInfo;
  address[] public contributors;

  function Project(address _owner, string _name, string _description, string _url, uint _targetAmount, uint _deadline) {
    if (_owner == 0) throw;
    if (_targetAmount == 0) throw;
    if (_deadline < now) throw;
    hub = msg.sender;
    owner = _owner;
    name = _name;
    description = _description;
    url = _url;
    targetAmount = _targetAmount;
    deadline = _deadline;
  }

  modifier onlyHub() {
    if (msg.sender != hub) throw;
    _
  }

  function contributionOf(address a) constant returns(uint) {
    return contributorInfo[a].amount;
  }

  // fund():  This is the function called when the FundingHub receives a contribution.
  // The function must keep track of the contributor and the individual amount contributed.
  // If the contribution was sent after the deadline of the project passed, or the full
  // amount has been reached, the function must return the value to the originator of the
  // transaction and call one of two functions. If the full funding amount has been reached,
  // the function must call payout. If the deadline has passed without the funding goal
  // being reached, the function must call refund.
  function fund(address source) onlyHub {
    // do not check the contributor address becase it is forwarded by the hub, there no risk it could be 0
    if (now <= deadline) {
      if (msg.value > 0) {
        uint amount = targetAmount - collectedFunds; // targetAmount is always >= of collectedFunds
        if (msg.value > amount) {
          // returns the change
          if (!source.send(msg.value - amount)) throw;
        } else {
          amount = msg.value;
        }
        collectedFunds += amount;
        Contributor info = contributorInfo[source];
        if (info.amount == 0)
          info.index = contributors.push(source);
        info.amount += amount;
        // do payout if the target is reached. The check is >= but the collected funds never exceeds the target
        if (collectedFunds >= targetAmount) payout();
      }
    } else {
      // fundraising period expired
      if (msg.value > 0) {
        if (!source.send(msg.value)) throw;
      }
      // after the deadline the balance may not be >= of targetAmount, should refund contributors
      if (this.balance > 0) refund();
    }
  }

  // This is the function that sends all funds received in the contract to the owner of the project.
  function payout() private returns(bool payedOut){
    // there is no check on balances because this is a private function called
    // only when balance == collectedFunds == targetAmount
    if (status == 0) {
      status = 1;
      payedOut = owner.send();
      // forward untrasfered ethers or excees amount (there should never be) to the hub to be handled by the manteiner
      if (this.balance > 0)
        hub.call.value(this.balance);
    }
  }

  // This function sends all individual contributions back to the respective contributor.
  function refund() private {
    if (status == 0) {
      status = 2;
      uint count = contributors.length;
      for (uint i=0; i < count; i++) {
        address target = contributors[i];
        Contributor info = contributorInfo[target];
        if (!target.send(info.amount))
          notRefund += info.amount);
      }
    }
  }

  // no direct transfers
  function () {
    throw;
  }
}
