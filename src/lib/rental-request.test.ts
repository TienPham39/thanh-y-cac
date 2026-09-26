import test from "node:test";
import assert from "node:assert/strict";
import { parseRentalRequest } from "./rental-request.ts";
const valid={id:"b07c9ef8-746e-4bdc-8004-820494920b01",productSlug:"mau-don",name:"Khách kiểm thử",phone:"0901234567",start:"2026-09-27",end:"2026-09-28",height:"160",weight:"50",note:"Thử đồ"};
test("valid request normalizes measurements and phone",()=>{assert.equal(parseRentalRequest({...valid,phone:"090 123 4567"},"2026-09-26")?.phone,"0901234567");assert.equal(parseRentalRequest(valid,"2026-09-26")?.height,160);});
test("reject invalid or reversed dates and past pickup",()=>{for(const patch of [{start:"2026-02-30"},{end:"2026-09-26"},{start:"2026-09-25"},{start:"invalid"}])assert.equal(parseRentalRequest({...valid,...patch},"2026-09-26"),null);});
test("reject missing identity, bad phones and oversized data",()=>{for(const patch of [{id:"bad"},{name:""},{phone:"123"},{note:"a".repeat(2001)},{height:99},{weight:201}])assert.equal(parseRentalRequest({...valid,...patch},"2026-09-26"),null);});
test("same day rental and optional measurements are allowed",()=>{assert.ok(parseRentalRequest({...valid,end:valid.start,height:"",weight:""},"2026-09-26"));});
