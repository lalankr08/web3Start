import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

const NAME = "MyToken";
const SUP = ethers.parseEther("1000000");
const ZERO = ethers.ZeroAddress;

const dep = () => ethers.deployContract(NAME, [SUP]);
const has = (t: any, f: string) => t.interface.hasFunction(f);

// true if the tx reverts
async function fails(p: Promise<any>) {
  try {
    await (await p).wait();
  } catch {
    return true;
  }
  return false;
}

describe("Stress: basics", function () {
  this.timeout(300000);

  it("initial state", async () => {
    const [a] = await ethers.getSigners();
    const t = await dep();
    expect(await t.totalSupply()).to.equal(SUP);
    expect(await t.balanceOf(a.address)).to.equal(SUP);
    expect(await t.decimals()).to.equal(18n);
  });

  it("edge transfers", async () => {
    const [a, b] = await ethers.getSigners();
    const t = await dep();
    await (await t.transfer(b.address, 0n)).wait();
    await (await t.transfer(a.address, 5n)).wait();
    expect(await t.balanceOf(a.address)).to.equal(SUP);
    await (await t.transfer(b.address, SUP)).wait();
    expect(await t.balanceOf(b.address)).to.equal(SUP);
    expect(await t.balanceOf(a.address)).to.equal(0n);
  });

  it("bad transfers revert", async () => {
    const [a, b] = await ethers.getSigners();
    const t = await dep();
    expect(await fails(t.transfer(ZERO, 1n))).to.equal(true);
    expect(await fails(t.transfer(b.address, SUP + 1n))).to.equal(true);
    expect(await fails(t.connect(b).transfer(a.address, 1n))).to.equal(true);
  });

  it("emits Transfer event", async () => {
    const [a, b] = await ethers.getSigners();
    const t = await dep();
    const rc: any = await (await t.transfer(b.address, 77n)).wait();
    const ev: any = t.interface.parseLog(rc.logs[0]);
    expect(ev.name).to.equal("Transfer");
    expect(ev.args[0]).to.equal(a.address);
    expect(ev.args[1]).to.equal(b.address);
    expect(ev.args[2]).to.equal(77n);
  });
});

describe("Stress: allowances", function () {
  this.timeout(300000);

  it("approve and transferFrom", async () => {
    const [a, b, c] = await ethers.getSigners();
    const t = await dep();
    await (await t.approve(b.address, 100n)).wait();
    expect(await t.allowance(a.address, b.address)).to.equal(100n);
    await (await t.connect(b).transferFrom(a.address, c.address, 60n)).wait();
    expect(await t.balanceOf(c.address)).to.equal(60n);
    expect(await t.allowance(a.address, b.address)).to.equal(40n);
  });

  it("over-spend and no-approval revert", async () => {
    const [a, b, c] = await ethers.getSigners();
    const t = await dep();
    expect(await fails(t.connect(b).transferFrom(a.address, c.address, 1n))).to.equal(true);
    await (await t.approve(b.address, 10n)).wait();
    expect(await fails(t.connect(b).transferFrom(a.address, c.address, 11n))).to.equal(true);
    expect(await fails(t.approve(ZERO, 1n))).to.equal(true);
  });

  it("max allowance is not reduced", async () => {
    const [a, b, c] = await ethers.getSigners();
    const t = await dep();
    await (await t.approve(b.address, ethers.MaxUint256)).wait();
    await (await t.connect(b).transferFrom(a.address, c.address, 123n)).wait();
    expect(await t.allowance(a.address, b.address)).to.equal(ethers.MaxUint256);
  });
});

describe("Stress: heavy load", function () {
  this.timeout(600000);

  it("300 random transfers match a local ledger", async () => {
    const sg = await ethers.getSigners();
    const t = await dep();
    const led: bigint[] = sg.map(() => 0n);
    led[0] = SUP;

    for (let i = 1; i < sg.length; i++) {
      await (await t.transfer(sg[i].address, 1000n)).wait();
      led[0] -= 1000n;
      led[i] = 1000n;
    }

    let s = 12345;
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296);

    for (let i = 0; i < 300; i++) {
      const f = rnd() % sg.length;
      const to = rnd() % sg.length;
      const amt = BigInt(rnd() % 1500);
      const ok = amt <= led[f];
      expect(await fails(t.connect(sg[f]).transfer(sg[to].address, amt))).to.equal(!ok);
      if (ok) {
        led[f] -= amt;
        led[to] += amt;
      }
    }

    let sum = 0n;
    for (let i = 0; i < sg.length; i++) {
      const b = await t.balanceOf(sg[i].address);
      expect(b).to.equal(led[i]);
      sum += b;
    }
    expect(sum).to.equal(SUP);
  });

  it("gas report", async () => {
    const [a, b] = await ethers.getSigners();
    const t = await dep();
    const r1: any = await (await t.transfer(b.address, 1n)).wait();
    const r2: any = await (await t.approve(b.address, 1n)).wait();
    const r3: any = await (await t.connect(b).transferFrom(a.address, b.address, 1n)).wait();
    console.log("    gas transfer:", r1.gasUsed.toString());
    console.log("    gas approve:", r2.gasUsed.toString());
    console.log("    gas transferFrom:", r3.gasUsed.toString());
  });
});

