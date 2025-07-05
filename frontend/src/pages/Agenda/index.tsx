import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Card, Input, message, Spin } from "antd";
import { TimeSlotSelector } from "./TimeSlot";

type Slot = { label: string; hour: number; minute: number };

function buildSlotIso(date: Date, hour: number, minute: number = 0): string {
  const utcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour + 3,
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

    const isConflicting = events.some((event) => {
      return slotIso >= event.start && slotIso < event.end;
    });

    return !isConflicting;
  });
}

const serviceOptions = [{ label: "Orçamento", value: "Orçamento" }];

export const Agenda: React.FC = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [apiEvents, setApiEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const getEvents = async () => {
    setIsLoading(true);
    try {
      const result = await fetch("http://localhost:4000/api/get-events");
      const data = await result.json();
      setApiEvents(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
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

  const onSchedule = async () => {
    try {
      const { hour = 0, minute = 0 } = selectedSlot || {};

      // Cria a data inicial com hora do slot
      const start = new Date(selectedDate);
      start.setHours(hour, minute, 0, 0);

      // Cria a data final com +1 hora
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      const data = {
        summary: `${selectedService} ${form.getFieldValue("nome")}`,
        description: `Celular: ${form.getFieldValue("nome")}. Agendado Online`,
        start,
        end,
      };

      const result = await fetch("http://localhost:4000/api/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!result.ok) throw new Error("Erro ao agendar");

      // Armazena agendamento no localStorage
      localStorage.setItem(
        "agendamento",
        JSON.stringify({
          date: start.toISOString(),
        })
      );

      // Redireciona para a tela de confirmação
      window.location.href = "/confirmacao";
      getEvents();
    } catch (error) {}
  };

  const allSlots = getAvailableSlots(slots, apiEvents, new Date(selectedDate));

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

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
          width: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 4 }}>
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
            await onSchedule();

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
      <TimeSlotSelector
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        allSlots={allSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={(slot) => {
          setSelectedSlot(slot);
          setIsModalVisible(true);
        }}
      ></TimeSlotSelector>
    </div>
  );
};
