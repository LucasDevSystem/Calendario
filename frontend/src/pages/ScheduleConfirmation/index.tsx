import { useEffect, useState } from "react";
import { Typography, Spin } from "antd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const { Title, Text } = Typography;

const WHATSAPP_NUMBER = "5531988056869";
const localData = localStorage.getItem("agendamento");
const { start = "", service = "", name = "" } = JSON.parse(localData || "");

export const Confirmacao = () => {
  const [agendamento, setAgendamento] = useState<Date | null>(null);

  useEffect(() => {
    if (localData) {
      const startDate = new Date(start);
      const parsedDate = new Date(startDate.setHours(startDate.getHours() + 3));
      setAgendamento(parsedDate);

      const mensagem = `Agendei um ${service} às ${format(
        parsedDate,
        "HH:mm"
      )} do dia ${format(parsedDate, "dd/MM/yyyy")}`;
      const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensagem
      )}`;

      // Redireciona após 4 segundos
      setTimeout(() => {
        window.location.href = link;
      }, 3000);
    }
  }, []);

  if (!agendamento) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
        <Text style={{ display: "block", marginTop: 16 }}>
          Carregando agendamento...
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, textAlign: "center", marginTop: 50 }}>
      <Title level={3}>✅ Agendamento Confirmado!</Title>
      <Text>
        <strong>{name + " "}</strong>
        Você tem um horário agendado para o dia{" "}
        <strong>
          {format(agendamento, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </strong>
        .
      </Text>

      <div style={{ marginTop: 40 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>
            Redirecionando para o WhatsApp{" "}
            <span role="img" aria-label="WhatsApp">
              📲💬
            </span>
            ...
          </Text>
        </div>
      </div>
    </div>
  );
};
