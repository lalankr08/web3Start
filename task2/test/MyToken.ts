import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
const SUP = ethers.parseEther("1000");

describe("MyToken", () => {
  async function dep() {
    const [a, b, c] = await ethers.getSigners();
    const t = await ethers.deployContract("MyToken", [SUP]);
    return { t, a, b, c };
  }

  it("has name, symbol, supply", async () => {
    const { t, a } = await dep();
    expect(await t.name()).to.equal("MyToken");
    expect(await t.symbol()).to.equal("MTK");
    expect(await t.totalSupply()).to.equal(SUP);
    expect(await t.balanceOf(a.address)).to.equal(SUP);
  });

  it("transfers", async () => {
    const { t, a, b } = await dep();
    await t.transfer(b.address, 100n);
    expect(await t.balanceOf(b.address)).to.equal(100n);
    expect(await t.balanceOf(a.address)).to.equal(SUP - 100n);
  });

  it("fails if balance too low", async () => {
    const { t, b, c } = await dep();
    await expect(t.connect(b).transfer(c.address, 1n)).to.be.revert(ethers);
  });

  it("approve and transferFrom", async () => {
    const { t, a, b, c } = await dep();
    await t.approve(b.address, 50n);
    expect(await t.allowance(a.address, b.address)).to.equal(50n);
    await t.connect(b).transferFrom(a.address, c.address, 30n);
    expect(await t.balanceOf(c.address)).to.equal(30n);
    expect(await t.allowance(a.address, b.address)).to.equal(20n);
  });

  it("transferFrom over allowance reverts", async () => {
    const { t, a, b, c } = await dep();
    await t.approve(b.address, 10n);
    await expect(
      t.connect(b).transferFrom(a.address, c.address, 11n)
    ).to.be.revert(ethers);
  });
});