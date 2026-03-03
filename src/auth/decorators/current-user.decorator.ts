import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JWT_Payload } from '../types';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JWT_Payload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['user'] as JWT_Payload;
  },
);
