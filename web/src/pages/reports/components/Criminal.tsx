import React from 'react';
import { ActionIcon, Badge, Checkbox, Group, Select, Text } from '@mantine/core';
import { IconCalendar, IconClockDown, IconDeviceFloppy, IconTrash } from '@tabler/icons-react';
import BadgeButton from '../../../components/BadgeButton';
import BaseCard from './BaseCard';
import type { Criminal } from '../../../state';
import { PrimitiveAtom, useAtom } from 'jotai';
import { useSetCriminals } from '../../../state';
import { modals } from '@mantine/modals';
import { DatePickerInput } from '@mantine/dates';
import EditChargesModal from './modals/editCharges/EditChargesModal';
import { useSetSelectedCharges } from '../../../state';

const percentages = [25, 50, 75, 80, 90];

const calculatePenalty = (percent?: number, value: number) => {
  if (!percent) return value;
  return Math.round(value - (percent / 100) * value);
};

const calculateReductions = (penalties: Criminal['penalty']) => {
  const reductions: Array<{ label: string; value: string }> = [];

  for (let i = 0; i < percentages.length; i++) {
    const percent = percentages[i];
    const time = penalties?.time !== undefined ? calculatePenalty(percent, penalties.time) : 0;
    const fine = penalties?.fine ? calculatePenalty(percent, penalties.fine) : 0;
    const points = penalties?.points ? calculatePenalty(percent, penalties.points) : 0;

    reductions[i] = {
      label: `${percent}% (${time} months / $${fine} / ${points} points)`,
      value: percent.toString(),
    };
  }

  return reductions;
};

const Criminal: React.FC<{ criminalAtom: PrimitiveAtom<Criminal> }> = ({ criminalAtom }) => {
  const [criminal, setCriminal] = useAtom(criminalAtom);
  const setSelectedCharges = useSetSelectedCharges();
  const setCriminals = useSetCriminals();

  return (
    <BaseCard key={criminal.name}>
      <Group position="apart" noWrap>
        <Text size="xl">{criminal.name}</Text>
        <Group spacing="xs">
          <ActionIcon
            color="red"
            variant="light"
            onClick={() =>
              modals.openConfirmModal({
                title: 'Remove criminal?',
                size: 'sm',
                labels: { confirm: 'Confirm', cancel: 'Cancel' },
                confirmProps: { color: 'red' },
                onConfirm: () => {
                  setCriminals((prev) => prev.filter((crim) => crim.name !== criminal.name));
                  //   fetchNui and remove from server db
                },
                children: (
                  <Text size="sm">
                    Remove {criminal.name}? Removing them will also remove the charges fromt their profile.
                  </Text>
                ),
              })
            }
          >
            <IconTrash size={20} />
          </ActionIcon>
          <ActionIcon color="blue" variant="light">
            <IconDeviceFloppy size={20} />
          </ActionIcon>
        </Group>
      </Group>
      <Group spacing="xs">
        <BadgeButton
          label="Edit Charges"
          onClick={() => {
            setSelectedCharges(criminal.charges);
            modals.open({
              title: 'Edit charges',
              children: <EditChargesModal criminalAtom={criminalAtom} />,
              size: 1200,
              styles: { body: { height: 600, overflow: 'hidden' }, content: { width: 900 } },
            });
          }}
        />
        {criminal.charges.map((charge) => (
          <Badge key={charge.label}>
            {charge.count}x {charge.label}
          </Badge>
        ))}
      </Group>
      <Checkbox
        label="Issue warrant"
        description="Suspect hasn't been processed and charged"
        checked={criminal.issueWarrant}
        onChange={() => setCriminal((prev) => ({ ...prev, issueWarrant: !prev.issueWarrant }))}
      />
      {criminal.issueWarrant ? (
        <>
          <DatePickerInput icon={<IconCalendar size={20} />} label="Warrant expiration date" placeholder="12/03/2023" />
        </>
      ) : (
        <>
          {criminal.penalty && (
            <>
              <Select
                label="Reduction"
                value={criminal.penalty?.reduction ? criminal.penalty.reduction.toString() : undefined}
                data={calculateReductions(criminal.penalty)}
                icon={<IconClockDown size={20} />}
                onChange={(val) =>
                  setCriminal((prev) => ({
                    ...prev,
                    penalty: prev.penalty
                      ? { ...prev.penalty, reduction: val ? +val : undefined }
                      : { reduction: val ? +val : undefined, time: 0, fine: 0, points: 0 },
                  }))
                }
                clearable
                placeholder="No reduction"
              />
              <Group position="apart">
                <Text size="xs">
                  Time: {calculatePenalty(criminal.penalty.reduction, criminal.penalty.time)} months
                </Text>
                <Text size="xs">Fine: ${calculatePenalty(criminal.penalty.reduction, criminal.penalty.fine)}</Text>
                <Text size="xs">Points: {calculatePenalty(criminal.penalty.reduction, criminal.penalty.points)}</Text>
              </Group>
              <Checkbox label="Pleaded guilty" defaultChecked={criminal.pleadedGuilty} />
            </>
          )}
        </>
      )}
    </BaseCard>
  );
};

export default Criminal;
