import test from "node:test";
import assert from "node:assert/strict";
import { overlapsReservation, reservationDays } from "./rental-reservations.ts";
test("pickup and return days are both reserved",()=>{assert.deepEqual(reservationDays("2026-09-26","2026-09-28"),["2026-09-26","2026-09-27","2026-09-28"]);});
test("same-day rental, year boundary and leap day",()=>{assert.equal(reservationDays("2026-09-26","2026-09-26").length,1);assert.deepEqual(reservationDays("2028-02-28","2028-03-01"),["2028-02-28","2028-02-29","2028-03-01"]);assert.equal(reservationDays("2026-12-31","2027-01-01").length,2);});
test("cannot overlap endpoints or span a reserved range",()=>{const booked=[{start:"2026-09-26",end:"2026-09-28"}];for(const [start,end]of [["2026-09-25","2026-09-26"],["2026-09-28","2026-09-29"],["2026-09-25","2026-09-29"]])assert.equal(overlapsReservation(start,end,booked),true);assert.equal(overlapsReservation("2026-09-29","2026-09-30",booked),false);});
test("reject reversed and excessive reservation windows",()=>{assert.throws(()=>reservationDays("2026-09-28","2026-09-26"));assert.throws(()=>reservationDays("2026-01-01","2028-01-01"));});
