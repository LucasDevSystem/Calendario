import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Card, Input, message, Spin } from "antd";
import { TimeSlotSelector } from "./TimeSlot";
// import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

type Slot = { label: string; hour: number; minute: number };

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

    const isConflicting = events.some((event) => {
      const startDate = new Date(event.start);
      startDate.setMinutes(0, 0, 0); // zera os minutos, segundos e ms

      const endDate = new Date(event.end);
      if (endDate.getMinutes() > 0 || endDate.getSeconds() > 0) {
        endDate.setHours(endDate.getHours() + 1, 0, 0, 0); // arredonda pra cima
      } else {
        endDate.setMinutes(0, 0, 0); // garante que também esteja limpo
      }

      return (
        slotIso >= startDate.toISOString() && slotIso < endDate.toISOString()
      );
    });

    return !isConflicting;
  });
}

const serviceOptions = [
  {
    label: "Orçamento",
    value: "Orçamento",
    image:
      "https://cdn.cobrefacil.com.br/website/base/c57/874/c9c/como-fazer-orcamento.jpg",
  },
  {
    label: "Teste",
    value: "Teste",
    image:
      "https://lh3.googleusercontent.com/gps-cs-s/AC9h4noO_jRfnx6xUjO8dT4TDfesNDfzBCZKvn5K0ca_wQ7CbfZX-WbSZ3qE5TJUaixLipR2YNnAbji5G-zwg8WfWMRU7GFeKgW3aNJ67M9YwM5ska41bgi2_UBIId1T4_V_gJomWm0=s680-w680-h510-rw",
  },
];

const API_URL = "https://calendario-s0ni.onrender.com/api";
const WHATSAPP_NUMBER = "5531988056869";

export const Agenda: React.FC = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [apiEvents, setApiEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [spinMessage, setSpinMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  // const navigate = useNavigate();

  const getEvents = async () => {
    setIsLoading(true);
    try {
      const result = await fetch(`${API_URL}/get-events`);
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

  const slots = useMemo(() => {
    const arr: Slot[] = [];
    const hours = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19];
    const now = new Date();

    // Função auxiliar para comparar só dia/mês/ano
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    for (const h of hours) {
      if (
        // Se for hoje, só adiciona horários maiores que a hora atual
        (isSameDay(selectedDate, now) && h > now.getHours()) ||
        // Se for outro dia (futuro), adiciona todos os horários
        selectedDate > now
      ) {
        arr.push({
          label: `${String(h).padStart(2, "0")}:00`,
          hour: h,
          minute: 0,
        });
      }
    }

    return arr;
  }, [selectedDate]);

  const onSchedule = async () => {
    try {
      setIsLoading(true);
      const { hour = 0, minute = 0 } = selectedSlot || {};

      // Usa a mesma lógica de buildSlotIso para garantir UTC correto
      const startIso = buildSlotIso(selectedDate, hour, minute);
      const start = new Date(startIso);

      const end = new Date(start);
      end.setHours(end.getHours() + 1); // adiciona 1h no UTC direto

      const data = {
        summary: `${selectedService} ${form.getFieldValue("nome")}`,
        description: `Celular: ${form.getFieldValue(
          "telefone"
        )}. Agendado Online`,
        start,
        end,
      };

      const result = await fetch(`${API_URL}/create-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!result.ok) throw new Error("Erro ao agendar");
      message.success("Agendamento realizado com sucesso!");

      const startDate = new Date(start);
      const parsedDate = new Date(startDate.setHours(startDate.getHours() + 3));

      const mensagem = `Agendei um ${selectedService} às ${format(
        parsedDate,
        "HH:mm"
      )} do dia ${format(parsedDate, "dd/MM/yyyy")}`;
      const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensagem
      )}`;
      setSpinMessage("✅ Agendamento Confirmado!");

      // Redireciona após 4 segundos
      setTimeout(() => {
        window.location.href = link;
      }, 1000);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const allSlots = getAvailableSlots(slots, apiEvents, new Date(selectedDate));
  const renderServiceCards = () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {serviceOptions.map((service) => (
        <Card
          key={service.value}
          onClick={() => setSelectedService(service.value)}
          hoverable
          cover={
            <img
              alt={service.label}
              src={service.image}
              style={{
                height: 80,
                objectFit: "cover",
              }}
            />
          }
          style={{
            width: 140,
            cursor: "pointer",
            border:
              selectedService === service.value
                ? "2px solid #1890ff"
                : "1px solid #f0f0f0",
            borderRadius: 6,
          }}
        >
          <div style={{ textAlign: "center", fontSize: 14 }}>
            {service.label}
          </div>
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
        <Spin size="large">{spinMessage}</Spin>
      </div>
    );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 0 }}>
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
          const hasErrors = await form
            .validateFields()
            .then(() => false)
            .catch(() => true);

          if (hasErrors) {
            message.warning("Preencha todos os campos corretamente.");
            return; // Evita prosseguir
          }

          // Tudo certo, pode agendar
          await onSchedule();
          // setIsModalVisible(false);
          // form.resetFields();
          setSelectedService(null);
          message.success("Agendamento realizado com sucesso!");
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
