import { useEffect, useState } from "react";
import { Typography } from "antd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const { Title, Text } = Typography;

export const Confirmacao = () => {
  const [agendamento, setAgendamento] = useState<Date | null>(null);

  useEffect(() => {
    const item = localStorage.getItem("agendamento");
    if (item) {
      const { date } = JSON.parse(item);
      setAgendamento(new Date(date));
    }
  }, []);

  if (!agendamento) return <Text>Carregando...</Text>;

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <Title level={3}>Agendamento Confirmado!</Title>
      <Text>
        Você tem um horário agendado para o dia{" "}
        <strong>
          {format(agendamento, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </strong>
        .
      </Text>
    </div>
  );
};
