import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Button,
  Row,
  Col,
  Typography,
  Space,
  Grid,
  Modal,
  Select,
  Form,
  Card,
  Input,
  message,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { addDays, format, isSameDay } from "date-fns";
import { da, ptBR } from "date-fns/locale";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type Slot = { label: string; hour: number; minute: number };

type TimeSlotSelectorProps = {
  allSlots: Slot[];
  selectedSlot: Slot | null;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: Slot) => void;
};

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  allSlots,
  selectedSlot,
  selectedDate,
  onSelectSlot,
  onSelectDate,
}) => {
  const screens = useBreakpoint();
  const today = new Date();

  const days = Array.from({ length: 8 }).map((_, i) => addDays(today, i));
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll para o dia selecionado
  useEffect(() => {
    const idx = days.findIndex((d) => isSameDay(d, selectedDate));
    const container = containerRef.current;
    if (container && idx >= 0) {
      const btn = container.children[idx] as HTMLElement;
      const offset =
        btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [selectedDate]);

  // Divide em manhã, tarde e noite
  const manhaSlots = useMemo(
    () => allSlots.filter((s) => s.hour >= 6 && s.hour < 12),
    [allSlots]
  );
  const tardeSlots = useMemo(
    () => allSlots.filter((s) => s.hour >= 12 && s.hour < 18),
    [allSlots]
  );
  const noiteSlots = useMemo(
    () => allSlots.filter((s) => s.hour >= 18),
    [allSlots]
  );

  const renderSlots = (title: string, slots: Slot[]) => (
    <div style={{ marginBottom: 24 }}>
      <Title level={4} style={{ fontSize: screens.xs ? 16 : 20 }}>
        {title}
      </Title>
      {slots.length > 0 ? (
        <Row gutter={[8, 8]}>
          {slots.map((slot) => {
            const isActive =
              selectedSlot?.hour === slot.hour &&
              selectedSlot?.minute === slot.minute;
            return (
              <Col key={slot.label} xs={24} sm={12} md={8} lg={6}>
                <Button
                  block
                  type={isActive ? "primary" : "default"}
                  size={screens.xs ? "middle" : "large"}
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot.label}
                </Button>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Text type="secondary">Não há horários disponíveis nesse período.</Text>
      )}
    </div>
  );

  return (
    <div
      style={{ maxWidth: 800, margin: "0 auto", padding: 24, paddingTop: 0 }}
    >
      <Space
        direction="vertical"
        style={{
          width: "100%",
          marginBottom: 16,
        }}
      >
        <Title
          level={4}
          style={{
            textAlign: "center",
            marginBottom: 8,
            fontSize: screens.xs ? 18 : 24,
          }}
        >
          Escolha o seu horário
        </Title>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Button
            icon={<LeftOutlined />}
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
          />

          <div
            ref={containerRef}
            style={{
              flex: 1,
              display: "flex",
              overflowX: "auto",
              padding: "0 4px",
              scrollSnapType: "x mandatory",
            }}
          >
            {days.map((day) => (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                style={{
                  minWidth: 60,
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "4px 0",
                  scrollSnapAlign: "center",
                  borderBottom: isSameDay(day, selectedDate)
                    ? "2px solid #fa8c16"
                    : "1px solid transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: isSameDay(day, selectedDate) ? "#fa8c16" : "#999",
                  }}
                >
                  {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                </Text>
                <br />
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: isSameDay(day, selectedDate) ? "#fa8c16" : "#333",
                  }}
                >
                  {format(day, "dd/MM")}
                </Text>
              </div>
            ))}
          </div>

          <Button
            icon={<RightOutlined />}
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
          />
        </div>
      </Space>

      {renderSlots("Manhã", manhaSlots)}
      {renderSlots("Tarde", tardeSlots)}
      {renderSlots("Noite", noiteSlots)}
    </div>
  );
};
