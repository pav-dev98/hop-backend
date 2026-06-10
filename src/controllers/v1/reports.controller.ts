import { Request, Response } from 'express';
import * as reports from '../../services/report.service';
import { sendSuccess } from '../../lib/http';
import { parseId, parseOptionalInt, parseOptionalDate } from '../../lib/params';

export async function dashboard(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await reports.dashboard());
}

export async function house(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  sendSuccess(res, await reports.houseReport(id));
}

export async function attendanceTrends(req: Request, res: Response): Promise<void> {
  const data = await reports.attendanceTrends({
    houseId: parseOptionalInt(req.query.houseId),
    startDate: parseOptionalDate(req.query.startDate),
    endDate: parseOptionalDate(req.query.endDate),
  });
  sendSuccess(res, data);
}

export async function visitorConversion(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await reports.visitorConversion());
}

export async function memberActivity(req: Request, res: Response): Promise<void> {
  const data = await reports.memberActivity({
    houseId: parseOptionalInt(req.query.houseId),
  });
  sendSuccess(res, data);
}
