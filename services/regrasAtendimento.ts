export type EtapaAtendimento =
  | "Novo"
  | "Em atendimento"
  | "Interessado"
  | "Visita agendada"
  | "Proposta"
  | "Fechado";

interface DataBrasil {
  ano: number;
  mes: number;
  dia: number;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const FUSO_BRASIL = "America/Sao_Paulo";

function dataNoBrasil(data: Date): DataBrasil | null {
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const ano = Number(partes.find((parte) => parte.type === "year")?.value);
  const mes = Number(partes.find((parte) => parte.type === "month")?.value);
  const dia = Number(partes.find((parte) => parte.type === "day")?.value);

  if (!ano || !mes || !dia) {
    return null;
  }

  return { ano, mes, dia };
}

function dataLocalParaUtc(
  ano: number,
  mes: number,
  dia: number,
  hora = 0
) {
  const desejadoUtc = Date.UTC(ano, mes - 1, dia, hora);
  let instante = desejadoUtc;

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: FUSO_BRASIL,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instante));
    const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
      Number(partes.find((parte) => parte.type === tipo)?.value);
    const localComoUtc = Date.UTC(
      valor("year"),
      valor("month") - 1,
      valor("day"),
      valor("hour")
    );

    instante -= localComoUtc - desejadoUtc;
  }

  return new Date(instante);
}

export function obterLimitesDiaBrasil(referencia = new Date()) {
  const dataBrasil = dataNoBrasil(referencia);

  if (!dataBrasil) {
    throw new Error("Não foi possível determinar a data atual no Brasil.");
  }

  const proximoDiaUtc = new Date(
    Date.UTC(dataBrasil.ano, dataBrasil.mes - 1, dataBrasil.dia + 1)
  );

  return {
    inicio: dataLocalParaUtc(
      dataBrasil.ano,
      dataBrasil.mes,
      dataBrasil.dia
    ).toISOString(),
    fimExclusivo: dataLocalParaUtc(
      proximoDiaUtc.getUTCFullYear(),
      proximoDiaUtc.getUTCMonth() + 1,
      proximoDiaUtc.getUTCDate()
    ).toISOString(),
  };
}

function diasEntreDatasBrasil(alvo: DataBrasil, referencia: DataBrasil) {
  const alvoUtc = Date.UTC(alvo.ano, alvo.mes - 1, alvo.dia);
  const referenciaUtc = Date.UTC(
    referencia.ano,
    referencia.mes - 1,
    referencia.dia
  );

  return Math.round((alvoUtc - referenciaUtc) / UM_DIA_MS);
}

export function calcularDiferencaDiasBrasil(
  dataAlvo: string | Date | null | undefined,
  referencia = new Date()
) {
  if (!dataAlvo) {
    return null;
  }

  const alvo =
    dataAlvo instanceof Date ? dataAlvo : new Date(dataAlvo);
  const alvoBrasil = dataNoBrasil(alvo);
  const referenciaBrasil = dataNoBrasil(referencia);

  if (!alvoBrasil || !referenciaBrasil) {
    return null;
  }

  return diasEntreDatasBrasil(alvoBrasil, referenciaBrasil);
}

export function calcularDiasDesdeBrasil(
  data: string | Date | null | undefined,
  referencia = new Date()
) {
  const diferencaDias = calcularDiferencaDiasBrasil(data, referencia);

  if (diferencaDias === null) {
    return null;
  }

  return Math.max(0, diferencaDias * -1);
}

export function avaliarClienteEsfriando(
  {
    etapa,
    ultimoContato,
    proximoContato,
  }: {
    etapa: EtapaAtendimento;
    ultimoContato: string | Date | null | undefined;
    proximoContato: string | Date | null | undefined;
  },
  referencia = new Date()
) {
  const diasSemContato = calcularDiasDesdeBrasil(
    ultimoContato,
    referencia
  );

  if (etapa === "Fechado" || diasSemContato === null || diasSemContato < 8) {
    return {
      esfriando: false,
      diasSemContato,
    };
  }

  const diasAteProximoContato = calcularDiferencaDiasBrasil(
    proximoContato,
    referencia
  );

  if (diasAteProximoContato !== null) {
    return {
      esfriando: false,
      diasSemContato,
    };
  }

  return {
    esfriando: true,
    diasSemContato,
  };
}
