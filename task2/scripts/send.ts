import { network } from "hardhat";

const { ethers } = await network.connect();
const ADDR = "0x70543F76a172519e389724223bA7AF8704485c63";
const [a, b, c] = await ethers.getSigners();
const t = await ethers.getContractAt("MyToken", ADDR);

const show = async (n: string, x: string) =>
  console.log(n, ethers.formatEther(await t.balanceOf(x)));

await show("a before", a.address);
let tx = await t.transfer(b.address, ethers.parseEther("100"));
await tx.wait();
console.log("a to b tx:", tx.hash);

tx = await t.connect(b).transfer(c.address, ethers.parseEther("40"));
await tx.wait();
console.log("b to c tx:", tx.hash);

await show("a", a.address);
await show("b", b.address);
await show("c", c.address);