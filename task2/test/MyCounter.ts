import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Counter mine", () => {
  it("starts at 0", async () => {
    const c = await ethers.deployContract("Counter");
    expect(await c.x()).to.equal(0n);
  });

  it("inc adds 1", async () => {
    const c = await ethers.deployContract("Counter");
    await c.inc();
    expect(await c.x()).to.equal(1n);
  });

  it("incBy adds n", async () => {
    const c = await ethers.deployContract("Counter");
    await c.incBy(5n);
    await c.incBy(3n);
    expect(await c.x()).to.equal(8n);
  });

  it("incBy 0 reverts", async () => {
    const c = await ethers.deployContract("Counter");
    await expect(c.incBy(0n)).to.be.revert(ethers);
  });
});