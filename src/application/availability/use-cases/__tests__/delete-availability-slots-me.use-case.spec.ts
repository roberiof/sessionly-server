import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  AvailabilitySlot,
  AvailabilitySlotType,
} from 'src/domain/entities/availability-slot.entity';
import type { AvailabilitySlotRepository } from 'src/domain/repositories/availability-slot.repository';
import { DeleteAvailabilitySlotsMeUseCase } from '../delete-availability-slots-me';

function makeSlotRepo(): jest.Mocked<
  Pick<
    AvailabilitySlotRepository,
    'findById' | 'deleteById' | 'create' | 'findByMentorId'
  >
> {
  return {
    findById: jest.fn(),
    deleteById: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(),
    findByMentorId: jest.fn(),
  };
}

const MENTOR_ID = 'mentor-1';
const SLOT_ID = 'slot-1';

function makeSlot(mentorId = MENTOR_ID) {
  return AvailabilitySlot.create({
    mentorId,
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    type: AvailabilitySlotType.ADD,
    ruleId: null,
  });
}

describe('DeleteAvailabilitySlotsMeUseCase', () => {
  let useCase: DeleteAvailabilitySlotsMeUseCase;
  let repo: ReturnType<typeof makeSlotRepo>;

  beforeEach(() => {
    repo = makeSlotRepo();
    useCase = new DeleteAvailabilitySlotsMeUseCase(repo);
  });

  it('deletes slot when caller owns it', async () => {
    repo.findById.mockResolvedValue(makeSlot());

    await useCase.execute(SLOT_ID, MENTOR_ID);

    expect(repo.deleteById).toHaveBeenCalledWith(SLOT_ID);
  });

  it('throws 403 when caller does not own the slot', async () => {
    repo.findById.mockResolvedValue(makeSlot('other-mentor'));

    await expect(useCase.execute(SLOT_ID, MENTOR_ID)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('throws when slot not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(SLOT_ID, MENTOR_ID)).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
