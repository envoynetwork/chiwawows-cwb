import { Fragment, useRef, useState, useEffect } from 'react';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  Keypair,
  Signer,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  ConfirmOptions,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Commitment,
  LAMPORTS_PER_SOL,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  clusterApiUrl
} from '@solana/web3.js'
import {AccountLayout,MintLayout,TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token";
import useNotify from './notify'
import * as tokenVesting from './bonfida'
import {sendTransactionWithRetry} from './utility'

let wallet : any
let conn = new Connection("https://still-broken-voice.solana-mainnet.quiknode.pro/a0e5912096ee9f23a155f489a7c6141b99c25cdd/");
let notify: any

const programID = new PublicKey('CChTq6PthWU82YZkbveA3WDf7s97BWhBK4Vx9bmsT743')

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
    ) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

export default function Vesting(){
	wallet = useWallet()
	notify = useNotify()

	const [vestingToken, setVestingToken] = useState("2S3hhwCnDkFN2zHYc7SBzhLuHUevMwmgUCzq3ShDsUb5")
	const [seed, setSeed] = useState('')
	const [seed2, setSeed2] = useState('')
	const [destWallet, setDestWallet] = useState('GhJf8rGvCYA9A29C9UuMcrRBzhejEfrdPaHWw5yqRiRU')
	const [destTokenAccount, setDestTokenAccount] = useState('')
	const [newDestTokenAccount, setNewDestTokenAccount] = useState('')
	const [startTime,setStartTime] = useState('2022-2-1')
	const [amount, setAmount] = useState('1')
	const [period, setPeriod] = useState('2')
	const [total, setTotal] = useState('')
	const [vestingInfo, setVestingInfo] = useState<any>(null)
	const [decimals, setDecimals] = useState(0)
	
	useEffect(()=>{
		const neededAmount =Math.floor( Number(amount) * Number(period) * 10000 ) / 10000
		setTotal(neededAmount.toString())
	},[amount, period])

	useEffect(()=>{changeWallet()},[destWallet])

	const changeWallet = async ()=>{
		try{
			const destWalletPubkey = new PublicKey(destWallet)
			const vestingTokenPubkey = new PublicKey(vestingToken)
			const destTokenAccountPubkey = await tokenVesting.findAssociatedTokenAddress(destWalletPubkey, vestingTokenPubkey)
			setDestTokenAccount(destTokenAccountPubkey.toBase58())
		} catch(e){
			setDestTokenAccount('')
		}
	}

	const vesting = async() => {
		try{
			let schedule : tokenVesting.Schedule[] = []
			let start = (new Date(startTime)).getTime()/1000
			const space = 30 * 24 * 3600
			const iter = Number(period) 
			const resp = await conn.getAccountInfo(new PublicKey(vestingToken))
			const mintInfo = MintLayout.decode(Buffer.from(resp!.data))
			const vestingAmount = Number(amount) * Math.pow(10, mintInfo.decimals)
			for(let i=0; i<iter; i++){
				schedule.push(new tokenVesting.Schedule(new tokenVesting.Numberu64(start),new tokenVesting.Numberu64(vestingAmount)))
				start += space
			}
			let seedWord = Buffer.concat([Buffer.from(seed),Buffer.alloc(31)],31)
			let instruction : TransactionInstruction[] = []
			if((await conn.getAccountInfo(new PublicKey(destTokenAccount))) == null){
				instruction.push(createAssociatedTokenAccountInstruction(
					new PublicKey(destTokenAccount), wallet.publicKey,  new PublicKey(destWallet), new PublicKey(vestingToken) 
				))
			}
			instruction = instruction.concat(await tokenVesting.create(
				conn, programID, seedWord,//tokenVesting.getDerivedSeed(Buffer.from(seed)),
				wallet.publicKey, wallet.publicKey, null,
				new PublicKey(destTokenAccount), new PublicKey(vestingToken), schedule
			))
			await sendTransactionWithRetry(conn, wallet, instruction, [])
			notify('success', 'Success!')
		}catch(e){
			console.log(e)
			notify('error', 'Failed Instruction')
		}
	}

	const changeDestination = async() => {
		try{
			const newDestTokenAccountPubkey = new PublicKey(newDestTokenAccount)
			let seedWord = Buffer.concat([Buffer.from(seed2),Buffer.alloc(31)],31)
			let instruction = await tokenVesting.changeDestination(
				conn, programID, wallet.publicKey , undefined, newDestTokenAccountPubkey, seedWord
			)
			console.log()
			await sendTransactionWithRetry(conn, wallet, instruction, [])
			notify('success', 'Success!')
		}catch(e){
			console.log(e)
			notify('error','Failed Instruction')
		}
	}

	return <div className="container-fluid mt-4 row">
		<div className="col-lg-6">
			<h4>Create Vesting</h4>
			<div className="input-group mb-3">
         <span className="input-group-text">Vesting Token</span>
        <input name="vestingToken"  type="text" className="form-control" onChange={(event)=>{setVestingToken(event.target.value)}} value={vestingToken}/>
      </div>
      <div className="input-group mb-3">
         <span className="input-group-text">Vesting Seed</span>
        <input name="seed"  type="text" className="form-control" onChange={(event)=>{setSeed(event.target.value)}} value={seed}/>
      </div>
      <div className="input-group mb-3">
         <span className="input-group-text">Destination Wallet</span>
        <input name="destWallet"  type="text" className="form-control" onChange={(event)=>{setDestWallet(event.target.value)}} value={destWallet}/>
      </div>
      <div className="input-group mb-3">
         <span className="input-group-text">Destination Token Acccount</span>
        <input name="destTokenAccount"  type="text" className="form-control" disabled={true} onChange={(event)=>{setDestTokenAccount(event.target.value)}} value={destTokenAccount}/>
      </div>
			<div className="input-group mb-3">
				<span className="input-group-text">Start Time</span>
				<input name="startTime" type="text" className="form-control" onChange={(event)=>{setStartTime(event.target.value)}} value={startTime}/>
				<span className="input-group-text">Example : 2022-1-1</span>
			</div>
			<div className="input-group mb-3">
				<span className="input-group-text">Amount/Month</span>
				<input name="amount" type="text" className="form-control" onChange={(event)=>{setAmount(event.target.value)}} value={amount}/>
			</div>
			<div className="input-group mb-3">
				<span className="input-group-text">Period</span>
				<input name="period" type="text" className="form-control" onChange={(event)=>{setPeriod(event.target.value)}} value={period}/>
				<span className="input-group-text">month</span>
			</div>
			<div className="input-group mb-3">
				<span className="input-group-text">Total Amount</span>
				<input name="total" type="text" disabled={true} className="form-control" value={total}/>
			</div>		
			{
				wallet && wallet.connected && 
				<div className="row container-fluid">
					<button type="button" className="btn btn-primary mb3" onClick={async ()=>{
						await vesting()
					}}>Vesting</button>
				</div>
			}
		</div>
		<div className="col-lg-6">
			<h4>Vesting Data</h4>
			<div className="input-group mb-3">
	         <span className="input-group-text">Vesting Seed</span>
	      	<input name="seed2"  type="text" className="form-control" onChange={async (event)=>{
	      		setSeed2(event.target.value)
	      		const seedWord = Buffer.concat([Buffer.from(event.target.value),Buffer.alloc(31)],31)
				  	const [vestingAccountKey, bump] = await PublicKey.findProgramAddress([seedWord],programID)
				  	const info = await tokenVesting.getContractInfo(conn, vestingAccountKey)
				  	setVestingInfo(info)
				  	if(info == null) return;
				  	const resp = await conn.getAccountInfo(new PublicKey(info.mintAddress))
						setDecimals(MintLayout.decode(Buffer.from(resp!.data)).decimals)
	      	}} value={seed2}/>
	      </div>
	      <div className="input-group mb-3">
	         <span className="input-group-text">New Destination Token Account</span>
	      	<input name="newDestTokenAccount"  type="text" className="form-control" onChange={(event)=>{setNewDestTokenAccount(event.target.value)}} value={newDestTokenAccount}/>
      		<button type="button" disabled={vestingInfo == null} className="btn btn-success" onClick={async ()=>{
      			await changeDestination()
      		}}>Change</button>
	      </div>
	      {
	      	vestingInfo != null &&
	      	<>
	      		<p>{"Destination : " + vestingInfo.destinationAddress!.toBase58()}</p>	      		
	      		<p>{"Token Address : " + vestingInfo.mintAddress!.toBase58()}</p>
		      	<table className="table">
		            <thead><tr><th>Amount</th><th>When</th></tr></thead>
		            <tbody>
		              {
		               (vestingInfo.schedules as any[]).map((item,idx) =>{
		                  return <tr key={idx}>
		                    <td>{item.amount.toNumber() ? (item.amount.toNumber() / Math.pow(10, decimals)) : "unlocked"}</td><td>{(new Date(item.releaseTime.toNumber()*1000)).toDateString()}</td>
		                  </tr>
		                })
		              }
		            </tbody>
		          </table>
	          </>
	      }
		</div>
	</div>
}