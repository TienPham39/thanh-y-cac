import { Prisma } from "@prisma/client";
import { reservationDays } from "@/lib/rental-reservations";
import { vietnamToday } from "@/lib/rental-calendar";
import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { getPrisma } from "@/lib/prisma";
import { isSameOriginRequest } from "@/lib/request-origin";
async function authorized(request: NextRequest) {
 const secret=process.env.AUTH_SECRET, token=request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
 return Boolean(secret && token && await verifySessionToken(token,secret));
}
export const dynamic="force-dynamic";
export async function GET(request: NextRequest) {
 if (!await authorized(request)) return new Response(null,{status:401});
 try {
  const db=getPrisma();
  const productCode=request.nextUrl.searchParams.get("productCode");
  if(productCode){
   if(productCode.length>40)return new Response(null,{status:422});
   const data=await db.rentalRequest.findMany({where:{productCode,status:"confirmed"},select:{id:true,start:true,end:true,name:true,phone:true},orderBy:{start:"asc"}});
   return Response.json({data},{headers:{"Cache-Control":"no-store"}});
  }
  const unread=await db.rentalRequest.count({where:{readAt:null}});
  if(request.nextUrl.searchParams.get("count")==="1") return Response.json({unread},{headers:{"Cache-Control":"no-store"}});
  const requestId=request.nextUrl.searchParams.get("requestId");
  if(requestId){
   if(requestId.length>36)return new Response(null,{status:422});
   const data=await db.rentalRequest.findMany({where:{id:requestId}});
   return Response.json({data,total:data.length,unread,page:1,pageSize:6},{headers:{"Cache-Control":"no-store"}});
  }
  const requested=Number(request.nextUrl.searchParams.get("page"));
  const requestedSize=Number(request.nextUrl.searchParams.get("pageSize"));
  const pageSize=[6,12,20,50].includes(requestedSize)?requestedSize:6;
  const total=await db.rentalRequest.count();
  const page=Math.min(Math.max(1,Math.ceil(total/pageSize)),Number.isSafeInteger(requested)&&requested>0?requested:1);
  const data=await db.rentalRequest.findMany({orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*pageSize,take:pageSize});
  return Response.json({data,total,unread,page,pageSize},{headers:{"Cache-Control":"no-store"}});
 } catch {return Response.json({error:"Không tải được yêu cầu thuê."},{status:503});}
}
export async function PATCH(request: NextRequest) {
 if(!await authorized(request)) return new Response(null,{status:401});
 if(!isSameOriginRequest(request.url,request.headers)) return new Response(null,{status:403});
 try {
  const body=await request.text();
  if(body.length>1000) return new Response(null,{status:413});
  const {id,action="read"}=JSON.parse(body);
  if(typeof id!=="string"||id.length!==36||!["read","confirm","cancel"].includes(action)) return new Response(null,{status:422});
  const result=await getPrisma().$transaction(async tx=>{
   const row=await tx.rentalRequest.findUnique({where:{id}});
   if(!row) return {status:404,error:"Không tìm thấy yêu cầu."};
   if(action==="read") {await tx.rentalRequest.update({where:{id},data:{readAt:row.readAt??new Date()}});return {status:200};}
   if(action==="cancel") {
    await tx.rentalRequest.update({where:{id},data:{status:"cancelled",readAt:row.readAt??new Date()}});
    await tx.rentalReservedDay.deleteMany({where:{requestId:id}});
    return {status:200};
   }
   if(row.status==="confirmed") return {status:200};
   if(row.status!=="pending")return {status:409,error:"Yêu cầu đã hủy, không thể xác nhận cọc."};
   if(row.start<vietnamToday()) return {status:422,error:"Ngày nhận đã qua. Vui lòng tạo yêu cầu với ngày thuê mới."};
   const days=reservationDays(row.start,row.end);
   const changed=await tx.rentalRequest.updateMany({where:{id,status:"pending"},data:{status:"confirmed",depositConfirmedAt:new Date(),readAt:row.readAt??new Date()}});
   if(!changed.count) return {status:409,error:"Yêu cầu vừa thay đổi. Vui lòng tải lại."};
   // Unique (productSlug, day) is the final arbiter, even for concurrent admins.
   await tx.rentalReservedDay.createMany({data:days.map(day=>({productSlug:row.productSlug,day,requestId:id}))});
   return {status:200};
  });
  return Response.json(result.error?{error:result.error}:{ok:true},{status:result.status});
 } catch(cause) {
  if(cause instanceof Prisma.PrismaClientKnownRequestError && ["P2002","P2034"].includes(cause.code)) return Response.json({error:"Lịch thuê bị trùng hoặc vừa được người khác xác nhận. Không lưu xác nhận cọc; hãy tải lại và kiểm tra lịch."},{status:409});
  return Response.json({error:"Chưa cập nhật được yêu cầu. Vui lòng thử lại."},{status:503});
 }
}
