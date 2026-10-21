// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.18 <0.9.0;

contract Main{

    string public name = "ZERO";
    string public symbol = "0";
    uint8 public decimals = 18; 
    uint256 public total; 
    address public owner; 

    mapping(address =>uint256) public bal; 
    mapping(address => mapping(address =>uint256)) public allowed; 

    
    uint256 private nonce;

    //events
    event Transfer(address indexed from, address indexed to, uint256 value); 
    event Approval(address indexed tokenOwner, address indexed spender, uint256 value);
    //tax taken event
    event EnvironmentTax(address indexed from, address indexed to, uint256 taxAmount, uint256 taxBp);

    constructor(){
        owner = msg.sender; 
        _mint(msg.sender, 200*10**decimals); 
    }

    modifier onlyOwner(){
        require(msg.sender ==owner, "Only owner can do this");
        _; 
    }

    //transfer
    function transfer(address to, uint256 amount) public returns (bool){
        _transfer(msg.sender, to , amount); 
        return true; 
    }

    function approve(address spender, uint256 amount) public returns (bool){
        require(spender != address(0), "Invalid spender"); 
        allowed[msg.sender][spender] = amount; 
        emit Approval(msg.sender, spender, amount); 
        return true; 
    }

    function transferFrom(address from , address to, uint256 amount) public returns(bool){
        require(allowed[from][msg.sender] >= amount, "This much not allowed"); 
        allowed[from][msg.sender] -=amount; 
        _transfer(from, to , amount); 
        return true; 
    }

    function mint(address to, uint256 amount) public onlyOwner{
        _mint(to, amount); 
    }

    //Internal functions
    function _rollTaxBp() internal returns (uint256) {
        nonce++;

        
        uint256 rand = uint256(
            keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, nonce))
        );

        uint256 band = rand % 3;          
        uint256 inside = (rand / 3) % 501;  

        if (band < 2) {
            return inside;      
        } else {
            return 500 + inside;    
        }
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "can't  send to zero addresss");
        require(bal[from] >= amount, "Get some money ");

        
        uint256 taxBp = _rollTaxBp();
        uint256 tax = (amount * taxBp) / 10000;
        uint256 received = amount - tax; 

        
        bal[from] -= amount; 
        bal[to] += received;   

        //total dec
        total -= tax;

        
        emit Transfer(from, to , received); 

        if (tax > 0) {
            emit Transfer(from, address(0), tax);
        }
        emit EnvironmentTax(from, to, tax, taxBp);
    }

    function _mint(address to, uint256 amount) internal{
        require(to != address(0), "can't mint to zero address");

        total += amount; 
        bal[to] += amount; 
        emit Transfer(address(0), to, amount); 
    }
    
}