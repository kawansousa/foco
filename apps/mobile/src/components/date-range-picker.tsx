import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { WEEKDAY_SHORT, addDays, diffDays, formatShort, toISODate, todayISO, type ISODate } from "@foco/shared";
import { Button, Chip, Row, Txt } from "./ui";
import { radius, space, useTheme } from "@/lib/theme";

export type DateRange = { from: ISODate; to: ISODate };

/** Máximo de dias num intervalo (cada dia é uma chamada à API). */
export const MAX_RANGE_DAYS = 31;

const MONTH_LONG = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "Hoje · 23 ago", "21 ago" ou "17 ago – 23 ago". */
export function formatRange(r: DateRange, today: ISODate = todayISO()): string {
  if (r.from === r.to) return r.from === today ? `Hoje · ${formatShort(r.from)}` : formatShort(r.from);
  return `${formatShort(r.from)} – ${formatShort(r.to)}`;
}

/** Botão que mostra o período escolhido e abre o calendário. */
export function DateRangeButton({ value, onPress }: { value: DateRange; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Escolher dia ou intervalo"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
        gap: 8,
        height: 42,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.input,
        backgroundColor: colors.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      <Txt weight="600" size={14} numberOfLines={1}>
        {formatRange(value)}
      </Txt>
      <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

type Props = {
  visible: boolean;
  value: DateRange;
  /** último dia selecionável (padrão: hoje) */
  maxDate?: ISODate;
  /** limite de dias no intervalo (padrão: MAX_RANGE_DAYS) */
  maxRangeDays?: number;
  onClose: () => void;
  onApply: (r: DateRange) => void;
};

/** Calendário: toque em um dia para escolher só ele; toque em outro para fechar um intervalo. */
export function DateRangePicker({ visible, value, maxDate = todayISO(), maxRangeDays = MAX_RANGE_DAYS, onClose, onApply }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#0008" }} onPress={onClose} accessibilityLabel="Fechar" />
      {/* key: remonta com o valor atual toda vez que abre (sem efeito de sincronização) */}
      <PickerBody
        key={`${value.from}_${value.to}`}
        value={value}
        maxDate={maxDate}
        maxRangeDays={maxRangeDays}
        onClose={onClose}
        onApply={onApply}
      />
    </Modal>
  );
}

function PickerBody({
  value,
  maxDate,
  maxRangeDays,
  onClose,
  onApply,
}: Omit<Props, "visible"> & { maxDate: ISODate; maxRangeDays: number }) {
  const { colors } = useTheme();
  const today = todayISO();
  const [start, setStart] = useState<ISODate | null>(value.from);
  const [end, setEnd] = useState<ISODate | null>(value.from === value.to ? null : value.to);
  const [cursor, setCursor] = useState(() => monthOf(value.to));

  const cells = useMemo(() => buildMonth(cursor.year, cursor.month), [cursor]);

  const pick = (d: ISODate) => {
    if (d > maxDate) return;
    if (!start || end) {
      setStart(d);
      setEnd(null);
      return;
    }
    if (d < start) {
      setStart(d);
      return;
    }
    if (d === start) {
      setEnd(null);
      return;
    }
    if (diffDays(start, d) + 1 > maxRangeDays) {
      setStart(addDays(d, -(maxRangeDays - 1)));
    }
    setEnd(d);
  };

  const quick = (from: ISODate, to: ISODate) => {
    setStart(from);
    setEnd(from === to ? null : to);
    setCursor(monthOf(to));
  };

  const apply = () => {
    if (!start) return;
    onApply({ from: start, to: end ?? start });
  };

  const selection: DateRange | null = start ? { from: start, to: end ?? start } : null;
  const canGoNext =
    cursor.year < Number(maxDate.slice(0, 4)) ||
    (cursor.year === Number(maxDate.slice(0, 4)) && cursor.month < Number(maxDate.slice(5, 7)) - 1);

  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingHorizontal: space.xl,
        paddingTop: space.lg,
        paddingBottom: 36,
        gap: space.md,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      }}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <Txt weight="600" size={17}>
          Dia ou intervalo
        </Txt>
        <Txt muted size={13}>
          {selection ? formatRange(selection, today) : "Toque em um dia"}
        </Txt>
      </Row>

      <Row gap={8} style={{ flexWrap: "wrap" }}>
        <Chip label="Hoje" active={selection?.from === today && selection?.to === today} onPress={() => quick(today, today)} />
        <Chip
          label="Ontem"
          active={selection?.from === addDays(today, -1) && selection?.to === addDays(today, -1)}
          onPress={() => quick(addDays(today, -1), addDays(today, -1))}
        />
        <Chip
          label="7 dias"
          active={selection?.from === addDays(today, -6) && selection?.to === today}
          onPress={() => quick(addDays(today, -6), today)}
        />
        <Chip
          label="30 dias"
          active={selection?.from === addDays(today, -29) && selection?.to === today}
          onPress={() => quick(addDays(today, -29), today)}
        />
      </Row>

      <Row style={{ justifyContent: "space-between" }}>
        <Pressable onPress={() => setCursor(shiftMonth(cursor, -1))} hitSlop={8} accessibilityLabel="Mês anterior" style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Txt weight="600" size={15} style={{ textTransform: "capitalize" }}>
          {MONTH_LONG[cursor.month]} {cursor.year}
        </Txt>
        <Pressable
          onPress={() => canGoNext && setCursor(shiftMonth(cursor, 1))}
          disabled={!canGoNext}
          hitSlop={8}
          accessibilityLabel="Próximo mês"
          style={{ padding: 6, opacity: canGoNext ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
        </Pressable>
      </Row>

      <View style={{ flexDirection: "row" }}>
        {WEEKDAY_SHORT.map((w) => (
          <Txt key={w} muted size={11} weight="500" center style={{ flex: 1, textTransform: "uppercase" }}>
            {w}
          </Txt>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        {cells.map((week, wi) => (
          <View key={wi} style={{ flexDirection: "row" }}>
            {week.map((d, di) => {
              if (!d) return <View key={di} style={{ flex: 1, height: 40 }} />;
              const disabled = d > maxDate;
              const isStart = selection?.from === d;
              const isEnd = selection?.to === d;
              const inRange = !!selection && d > selection.from && d < selection.to;
              const isToday = d === today;
              return (
                <Pressable
                  key={di}
                  onPress={() => pick(d)}
                  disabled={disabled}
                  accessibilityLabel={formatShort(d)}
                  accessibilityState={{ selected: isStart || isEnd || inRange, disabled }}
                  style={{
                    flex: 1,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: inRange ? colors.primarySoft : "transparent",
                    borderTopLeftRadius: isStart ? 999 : inRange ? 0 : 999,
                    borderBottomLeftRadius: isStart ? 999 : inRange ? 0 : 999,
                    borderTopRightRadius: isEnd ? 999 : inRange ? 0 : 999,
                    borderBottomRightRadius: isEnd ? 999 : inRange ? 0 : 999,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isStart || isEnd ? colors.primary : "transparent",
                      borderWidth: isToday && !isStart && !isEnd ? 1 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <Txt
                      size={14}
                      weight={isStart || isEnd || isToday ? "600" : "400"}
                      style={{
                        color: isStart || isEnd ? colors.primaryForeground : disabled ? colors.mutedForeground + "66" : colors.foreground,
                      }}
                    >
                      {Number(d.slice(8, 10))}
                    </Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Txt muted size={12}>
        Toque em um dia para ver só ele, ou em dois para um intervalo (até {maxRangeDays} dias).
      </Txt>

      <Row gap={space.sm}>
        <View style={{ flex: 1 }}>
          <Button title="Cancelar" variant="ghost" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Aplicar" disabled={!start} onPress={apply} />
        </View>
      </Row>
    </View>
  );
}

/* ---------- helpers ---------- */

type Month = { year: number; month: number };

function monthOf(d: ISODate): Month {
  return { year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) - 1 };
}

function shiftMonth(m: Month, n: number): Month {
  const d = new Date(m.year, m.month + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** Semanas do mês (domingo → sábado), com null nas células vazias. */
function buildMonth(year: number, month: number): (ISODate | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (ISODate | null)[][] = [];
  let week: (ISODate | null)[] = Array(first.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(toISODate(new Date(year, month, day)));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks;
}
