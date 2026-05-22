import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/application/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/application/auth/guards/roles.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RESPONSE } from 'src/core/response/response.messages';
import { UserRole } from 'src/domain/entities/user.entity';
import {
  ApiAvailabilityController,
  ApiAvailabilityCreateSlotMeDocs,
  ApiAvailabilityDeleteSlotMeDocs,
  ApiAvailabilityFetchMeDocs,
  ApiAvailabilityUpdateRulesMeDocs,
} from './availability-http.decorator';
import {
  AvailabilityRulesPresenter,
  AvailabilitySlotPresenter,
} from './availability.presenter';
import { CreateAvailabilitySlotDto } from './dtos/create-availability-slot.dto';
import { CreateAvailabilitySlotsMeUseCase } from './use-cases/create-availability-slots-me.use-case';
import { UpdateAvailabilityRulesMeUseCase } from './use-cases/update-availability-rules-me.use-case';
import { DeleteAvailabilitySlotsMeUseCase } from './use-cases/delete-availability-slots-me';
import { UpdateAvailabilityRulesDto } from './dtos/update-availability-rules.dto';
import { FetchAvailabilitySlotDto } from './dtos/fetch-availabity.dto';
import { FetchAvailabilityMeUseCase } from './use-cases/fetch-availability-me.use-case';

@ApiAvailabilityController()
@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MENTOR)
export class AvailabilityController {
  constructor(
    private readonly createAvailabilitySlotsMeUseCase: CreateAvailabilitySlotsMeUseCase,
    private readonly updateAvailabilityRulesMeUseCase: UpdateAvailabilityRulesMeUseCase,
    private readonly fetchAvailabilityMeUseCase: FetchAvailabilityMeUseCase,
    private readonly deleteAvailabilitySlotsMeUseCase: DeleteAvailabilitySlotsMeUseCase,
  ) {}

  @Post('slots')
  @ApiAvailabilityCreateSlotMeDocs()
  async createSlot(
    @Body() body: CreateAvailabilitySlotDto,
    @CurrentUser() user: { userId: string },
  ) {
    const slot = await this.createAvailabilitySlotsMeUseCase.execute(
      user.userId,
      body,
    );

    return {
      message: RESPONSE.AVAILABILITY.SLOT_CREATED_SUCCESSFULLY,
      data: {
        slot: AvailabilitySlotPresenter.toHTTP(slot),
      },
    };
  }

  @Put('rules')
  @ApiAvailabilityUpdateRulesMeDocs()
  async updateRules(
    @Body() body: UpdateAvailabilityRulesDto,
    @CurrentUser() user: { userId: string },
  ) {
    const rules = await this.updateAvailabilityRulesMeUseCase.execute(
      user.userId,
      body,
    );

    return {
      message: RESPONSE.AVAILABILITY.RULES_UPDATED_SUCCESSFULLY,
      data: {
        rules: AvailabilityRulesPresenter.toHTTP(rules),
      },
    };
  }

  @Delete('slots/:slotId')
  @ApiAvailabilityDeleteSlotMeDocs()
  async deleteSlot(
    @Param('slotId') slotId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.deleteAvailabilitySlotsMeUseCase.execute(slotId, user.userId);

    return {
      message: RESPONSE.AVAILABILITY.SLOT_DELETED_SUCCESSFULLY,
    };
  }

  @Get('me')
  @ApiAvailabilityFetchMeDocs()
  async fetchAvailability(
    @Query() query: FetchAvailabilitySlotDto,
    @CurrentUser() user: { userId: string },
  ) {
    const { slots, rules } = await this.fetchAvailabilityMeUseCase.execute(
      user.userId,
      query,
    );

    return {
      message: RESPONSE.AVAILABILITY.FETCHED_SUCCESSFULLY,
      data: {
        slots: slots.map((i) => AvailabilitySlotPresenter.toHTTP(i)),
        rules: !rules ? null : AvailabilityRulesPresenter.toHTTP(rules),
      },
    };
  }
}
