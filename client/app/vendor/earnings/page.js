"use client";
import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { MetricCard } from "@/components/shared/MetricCard";
export default function VendorEarningsPage(){const {token,error,setError}=useAccessToken("Login with a vendor account to view earnings.");const[data,setData]=useState(null);useEffect(()=>{async function load(){if(!token)return;try{const response=await marketplaceApi.getVendorAnalytics(token);setData(response.data);}catch(err){setError(err.message);}}load();},[token]);return <section className="grid gap-6"><div><div className="eyebrow">Vendor</div><h1 className="page-title">Earnings & fees</h1></div>{error?<div className="card section small">{error}</div>:null}{data?<div className="metric-grid"><MetricCard label="Gross revenue" value={`$${data.revenue.toFixed(2)}`} /><MetricCard label="Vendor store fee" value={`$${data.storeFee.toFixed(2)}`} detail="10% platform fee" /><MetricCard label="Net payout" value={`$${data.netEarnings.toFixed(2)}`} /></div>:null}</section>;}
