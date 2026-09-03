-- ===========================================================
-- Inova Social AI
-- Migração do banco existente
-- Versão 2.0
-- ===========================================================

-- ===========================================================
-- 1. EMPRESAS
-- ===========================================================

CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    logo TEXT,
    plano TEXT DEFAULT 'free',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_empresas_nome
ON empresas(nome);


-- ===========================================================
-- 2. PROFILES
-- ===========================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nome TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS telefone TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cargo TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'corretor';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_usage INTEGER DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_empresa
ON profiles(empresa_id);


-- ===========================================================
-- 3. CLIENTES
-- ===========================================================

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS corretor_id UUID;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS cpf TEXT;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS profissao TEXT;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS renda NUMERIC(12,2);

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS estado_civil TEXT;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS filhos INTEGER DEFAULT 0;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_clientes_empresa
ON clientes(empresa_id);

CREATE INDEX IF NOT EXISTS idx_clientes_corretor
ON clientes(corretor_id);


-- ===========================================================
-- 4. IMOVEIS
-- ===========================================================

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS codigo TEXT;

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS finalidade TEXT;

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS metragem NUMERIC(10,2);

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE imoveis
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_imoveis_empresa
ON imoveis(empresa_id);

CREATE INDEX IF NOT EXISTS idx_imoveis_bairro
ON imoveis(bairro);

CREATE INDEX IF NOT EXISTS idx_imoveis_status
ON imoveis(status);

-- ===========================================================
-- 5. AGENDA
-- ===========================================================

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS empresa_id UUID;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS cliente_id UUID;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS corretor_id UUID;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS descricao TEXT;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ;

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE agenda
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agenda_empresa
ON agenda(empresa_id);

CREATE INDEX IF NOT EXISTS idx_agenda_cliente
ON agenda(cliente_id);

CREATE INDEX IF NOT EXISTS idx_agenda_corretor
ON agenda(corretor_id);


-- ===========================================================
-- 6. HISTORICO
-- ===========================================================

CREATE TABLE IF NOT EXISTS historico (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID,

    usuario_id UUID,

    tipo TEXT,

    descricao TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_historico_cliente
ON historico(cliente_id);

CREATE INDEX IF NOT EXISTS idx_historico_usuario
ON historico(usuario_id);


-- ===========================================================
-- 7. PIPELINE
-- ===========================================================

CREATE TABLE IF NOT EXISTS pipeline (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID,

    etapa TEXT,

    probabilidade INTEGER DEFAULT 0,

    valor NUMERIC(12,2),

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_pipeline_cliente
ON pipeline(cliente_id);


-- ===========================================================
-- 8. VISITAS
-- ===========================================================

CREATE TABLE IF NOT EXISTS visitas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID,

    imovel_id UUID,

    corretor_id UUID,

    data_visita TIMESTAMPTZ,

    status TEXT DEFAULT 'agendada',

    observacoes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_visitas_cliente
ON visitas(cliente_id);

CREATE INDEX IF NOT EXISTS idx_visitas_imovel
ON visitas(imovel_id);

CREATE INDEX IF NOT EXISTS idx_visitas_corretor
ON visitas(corretor_id);

CREATE INDEX IF NOT EXISTS idx_visitas_status
ON visitas(status);


-- ===========================================================
-- 9. TAREFAS
-- ===========================================================

CREATE TABLE IF NOT EXISTS tarefas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID,

    cliente_id UUID,

    titulo TEXT,

    descricao TEXT,

    prioridade TEXT DEFAULT 'media',

    concluida BOOLEAN DEFAULT FALSE,

    vencimento TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_tarefas_usuario
ON tarefas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_cliente
ON tarefas(cliente_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_status
ON tarefas(concluida);