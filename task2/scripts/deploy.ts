import { network } from "hardhat";

const { ethers } = await network.connect();
const [d] = await ethers.getSigners();
console.log("deployer:", d.address);

const t = await ethers.deployContract("MyToken", [ethers.parseEther("1000000")]);
await t.waitForDeployment();
console.log("token at:", await t.getAddress());