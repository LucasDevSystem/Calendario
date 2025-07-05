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
type CalendarEvent = {
  start: string; // ou Date, dependendo de como vem da API
  end: string;
};

function buildSlotIso(date: Date, hour: number, minute: number = 0): string {
  const utcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
      0,
      0
    )
  );
  return utcDate.toISOString();
}

function getAvailableSlots(
  allSlots: Slot[],
  events: { start: string; end: string }[],
  date: Date
): Slot[] {
  return allSlots.filter((slot) => {
    const slotIso = buildSlotIso(date, slot.hour, slot.minute);
    console.log(slotIso);

    const isConflicting = events.some((event) => {
      return slotIso >= event.start && slotIso < event.end;
    });

    return !isConflicting;
  });
}

const serviceOptions = [{ label: "Orçamento", value: "orcamento" }];

export const TimeSlotSelector: React.FC = () => {
  const screens = useBreakpoint();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [apiEvents, setApiEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [form] = Form.useForm();

  const days = Array.from({ length: 21 }).map((_, i) => addDays(today, i));
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

  const getEvents = async () => {
    try {
      const result = await fetch("http://localhost:4000/api/get-events");
      const data = await result.json();
      setApiEvents(data);
    } catch (error) {}
  };

  useEffect(() => {
    getEvents();
  }, []);

  const slots: Slot[] = useMemo(() => {
    const arr: Slot[] = [];
    const hours = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19];

    for (const h of hours) {
      arr.push({
        label: `${String(h).padStart(2, "0")}:00`,
        hour: h,
        minute: 0,
      });
    }
    return arr;
  }, []);

  const allSlots = getAvailableSlots(slots, apiEvents, new Date(selectedDate));

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

  const renderServiceCards = () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {serviceOptions.map((service) => (
        <Card
          key={service.value}
          onClick={() => setSelectedService(service.value)}
          style={{
            width: 120,
            cursor: "pointer",
            borderColor:
              selectedService === service.value ? "#1890ff" : "#f0f0f0",
          }}
          hoverable
        >
          <div style={{ textAlign: "center" }}>{service.label}</div>
        </Card>
      ))}
    </div>
  );

  const renderDayButton = (day: Date) => {
    const isSelected = isSameDay(day, selectedDate);
    return (
      <div
        key={day.toISOString()}
        onClick={() => setSelectedDate(day)}
        style={{
          minWidth: screens.xs ? 48 : 64,
          padding: "8px 0",
          margin: "0 4px",
          cursor: "pointer",
          textAlign: "center",
          borderBottom: isSelected ? "3px solid #fa8c16" : "1px solid #ddd",
        }}
      >
        <Text
          style={{
            display: "block",
            fontSize: 12,
            color: isSelected ? "#fa8c16" : "#888",
          }}
        >
          {format(day, "EEE", { locale: ptBR }).toUpperCase()}
        </Text>
        <Text
          strong
          style={{
            display: "block",
            fontSize: 16,
            color: isSelected ? "#fa8c16" : "#333",
          }}
        >
          {format(day, "dd/MM")}
        </Text>
      </div>
    );
  };

  const renderSlots = (title: string, slots: Slot[]) => (
    <div style={{ marginBottom: 24 }}>
      <Title level={4}>{title}</Title>
      {slots.length > 0 ? (
        <Row gutter={[16, 16]}>
          {slots.map((slot) => {
            const isActive =
              selectedSlot?.hour === slot.hour &&
              selectedSlot?.minute === slot.minute;
            return (
              <Col key={slot.label} xs={12} sm={8} md={6} lg={4}>
                <Button
                  block
                  type={isActive ? "primary" : "default"}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setIsModalVisible(true);
                  }}
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
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Modal
        open={isModalVisible}
        title={`Você está agendando para ${selectedSlot?.label}`}
        onCancel={() => {
          setSelectedSlot(null);
          setIsModalVisible(false);
          setSelectedService(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setIsModalVisible(false);
            form.resetFields();
            setSelectedService(null);
            message.success("Agendamento realizado com sucesso!");
          } catch {
            message.warning("Preencha todos os campos corretamente.");
          }
        }}
        okText="Confirmar Agendamento"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tipo de Serviço" required>
            {renderServiceCards()}
            {!selectedService && (
              <div style={{ color: "red", marginTop: 8 }}>
                Selecione um tipo de serviço.
              </div>
            )}
          </Form.Item>

          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: "Informe seu nome" }]}
          >
            <Input placeholder="Digite seu nome completo" />
          </Form.Item>

          <Form.Item
            label="Telefone"
            name="telefone"
            rules={[{ required: true, message: "Informe seu telefone" }]}
          >
            <Input placeholder="(00) 00000-0000" />
          </Form.Item>
        </Form>
      </Modal>
      <Title level={3} style={{ textAlign: "center" }}>
        Escolha o seu horário
      </Title>
      <Space
        align="center"
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Button
          icon={<LeftOutlined />}
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
        >
          Anterior
        </Button>
        <div
          ref={containerRef}
          style={{
            display: "flex",
            overflowX: "auto",
            flex: 1,
            padding: "0 8px",
          }}
        >
          {days.map(renderDayButton)}
        </div>
        <Button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          icon={<RightOutlined />}
        >
          Próximo
        </Button>
      </Space>

      {renderSlots("Manhã", manhaSlots)}
      {renderSlots("Tarde", tardeSlots)}
      {renderSlots("Noite", noiteSlots)}
    </div>
  );
};
