// src/utils/response.helper.ts
export function ok(res: any, data: any) {
  return res.json({ success: true, data });
}
export function error(res: any, message: string, status = 400) {
  return res.status(status).json({ success: false, message });
}
