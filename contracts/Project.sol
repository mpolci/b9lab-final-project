contract Project {

  struct ProjectInfo {
    string name;
    string description;
    string url;
    address owner;
    uint targetAmount;
    uint deadline;
  }

  ProjectInfo public info;
  address public hub;
  uint public collectedFunds;
  uint public status; // 0: in progress - 1: payed out - 2: refunded

  struct Contributor {
    uint amount;
    uint index;
  }
  
  mapping (address => Contributor) contributorInfo;
  address[] public contributors;

  function Project(address _owner, string _name, string _description, string _url, uint _targetAmount, uint _deadline) {
    if (_owner == 0) throw;
    if (_targetAmount == 0) throw;
    if (_deadline < now) throw;
    hub = msg.sender;
    info = ProjectInfo({
      owner: _owner,
      name: _name,
      description: _description,
      url: _url,
      targetAmount: _targetAmount,
      deadline: _deadline,
    });
  }

  modifier onlyHub() {
    if (msg.sender != hub) throw;
    _
  }

  function contributionOf(address a) constant returns(uint) {
    return contributorInfo[a].amount;
  }

  function fund(address source) onlyHub {
    if (now <= info.deadline) {
      if (msg.value > 0) {
        uint amount = info.targetAmount - collectedFunds; // targetAmount is always >= of collectedFunds
        if (msg.value > amount) {
          // returns the change
          if (!source.send(msg.value - amount)) throw;
        } else {
          amount = msg.value;
        }
        collectedFunds += amount;
        Contributor cData = contributorInfo[source];
        if (cData.amount == 0)
          cData.index = contributors.push(source);
        cData.amount += amount;
        // do payout if the target is reached. The check is >= but the collected funds never exceeds the target
        if (collectedFunds >= info.targetAmount) payout();
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
      payedOut = info.owner.send(collectedFunds);
      // forward untrasfered ethers or excees amount (there should never be) to the hub to be handled by the maintainer
      if (this.balance > 0)
        hub.call.value(this.balance);
      return payedOut;
    }
  }

  // This function sends all individual contributions back to the respective contributor.
  function refund() private {
    if (status == 0) {
      status = 2;
      uint contributorsCount = contributors.length;
      for (uint i=0; i < contributorsCount; i++) {
        address target = contributors[i];
        Contributor c = contributorInfo[target];
        if (!target.send(c.amount)) {
          // ignore transfer errors because all untrasfered funds will be forwarded
          // to the hub to be handled by the maintainer
        }
      }
      // forward untrasfered ethers to the hub to be handled by the maintainer
      if (this.balance > 0)
        hub.call.value(this.balance);
    }
  }

  // no direct transfers
  function () {
    throw;
  }
}
