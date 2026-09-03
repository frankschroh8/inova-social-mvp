-- ===========================================================
-- Inova Social AI
-- Schema Principal
-- Versão 1.0
-- ===========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================
-- EMPRESAS
-- ===========================================================

CREATE TABLE empresas (
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

CREATE INDEX idx_empresas_nome
ON empresas(nome);

-- ===========================================================
-- PROFILES
-- ===========================================================

CREATE TABLE profiles (

    id UUID PRIMARY KEY,

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    nome TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    telefone TEXT,

    cargo TEXT,

    avatar TEXT,

    role TEXT DEFAULT 'corretor',

    ai_usage INTEGER DEFAULT 0,

    plan TEXT DEFAULT 'free',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_profiles_empresa
ON profiles(empresa_id);

CREATE INDEX idx_profiles_email
ON profiles(email);

-- ===========================================================
-- CLIENTES
-- ===========================================================

CREATE TABLE clientes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    corretor_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    nome TEXT NOT NULL,

    cpf TEXT UNIQUE,

    telefone TEXT,

    email TEXT,

    profissao TEXT,

    renda NUMERIC(12,2),

    estado_civil TEXT,

    filhos INTEGER DEFAULT 0,

    observacoes TEXT,

    status TEXT DEFAULT 'lead',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_clientes_empresa
ON clientes(empresa_id);

CREATE INDEX idx_clientes_corretor
ON clientes(corretor_id);

CREATE INDEX idx_clientes_nome
ON clientes(nome);

-- ===========================================================
-- IMOVEIS
-- ===========================================================

CREATE TABLE imoveis (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    codigo TEXT UNIQUE,

    titulo TEXT NOT NULL,

    tipo TEXT,

    finalidade TEXT,

    bairro TEXT,

    cidade TEXT,

    estado TEXT,

    endereco TEXT,

    valor NUMERIC(12,2),

    condominio NUMERIC(12,2),

    iptu NUMERIC(12,2),

    quartos INTEGER,

    suites INTEGER,

    banheiros INTEGER,

    vagas INTEGER,

    metragem NUMERIC(10,2),

    descricao TEXT,

    status TEXT DEFAULT 'disponivel',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_imoveis_empresa
ON imoveis(empresa_id);

CREATE INDEX idx_imoveis_bairro
ON imoveis(bairro);

CREATE INDEX idx_imoveis_status
ON imoveis(status);

-- ===========================================================
-- IMAGENS
-- ===========================================================

CREATE TABLE imagens (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE CASCADE,

    url TEXT NOT NULL,

    ordem INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_imagens_imovel
ON imagens(imovel_id);

-- ===========================================================
-- AGENDA
-- ===========================================================

CREATE TABLE agenda (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    corretor_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    titulo TEXT NOT NULL,

    descricao TEXT,

    data_inicio TIMESTAMPTZ NOT NULL,

    data_fim TIMESTAMPTZ,

    status TEXT DEFAULT 'agendado',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_agenda_cliente
ON agenda(cliente_id);

CREATE INDEX idx_agenda_corretor
ON agenda(corretor_id);

-- ===========================================================
-- HISTORICO
-- ===========================================================

CREATE TABLE historico (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    tipo TEXT,

    descricao TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_historico_cliente
ON historico(cliente_id);

CREATE INDEX idx_historico_usuario
ON historico(usuario_id);


-- ===========================================================
-- PIPELINE
-- ===========================================================

CREATE TABLE pipeline (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    etapa TEXT,

    probabilidade INTEGER DEFAULT 0,

    valor NUMERIC(12,2),

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_pipeline_cliente
ON pipeline(cliente_id);



-- ===========================================================
-- VISITAS
-- ===========================================================

CREATE TABLE visitas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE CASCADE,

    corretor_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    data_visita TIMESTAMPTZ,

    status TEXT DEFAULT 'agendada',

    observacoes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_visitas_cliente
ON visitas(cliente_id);

CREATE INDEX idx_visitas_imovel
ON visitas(imovel_id);

CREATE INDEX idx_visitas_status
ON visitas(status);


-- ===========================================================
-- TAREFAS
-- ===========================================================

CREATE TABLE tarefas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    titulo TEXT,

    descricao TEXT,

    prioridade TEXT DEFAULT 'media',

    concluida BOOLEAN DEFAULT FALSE,

    vencimento TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_tarefas_usuario
ON tarefas(usuario_id);

CREATE INDEX idx_tarefas_cliente
ON tarefas(cliente_id);

CREATE INDEX idx_tarefas_status
ON tarefas(concluida);

-- ===========================================================
-- ANOTACOES
-- ===========================================================

CREATE TABLE anotacoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE CASCADE,

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    titulo TEXT,

    conteudo TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_anotacoes_empresa
ON anotacoes(empresa_id);

CREATE INDEX idx_anotacoes_cliente
ON anotacoes(cliente_id);

CREATE INDEX idx_anotacoes_imovel
ON anotacoes(imovel_id);

CREATE INDEX idx_anotacoes_usuario
ON anotacoes(usuario_id);


-- ===========================================================
-- PROPOSTAS
-- ===========================================================

CREATE TABLE propostas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE CASCADE,

    corretor_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    valor NUMERIC(12,2) NOT NULL,

    valor_contraproposta NUMERIC(12,2),

    entrada NUMERIC(12,2),

    financiamento NUMERIC(12,2),

    observacoes TEXT,

    status TEXT DEFAULT 'enviada',

    validade DATE,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_propostas_empresa
ON propostas(empresa_id);

CREATE INDEX idx_propostas_cliente
ON propostas(cliente_id);

CREATE INDEX idx_propostas_imovel
ON propostas(imovel_id);

CREATE INDEX idx_propostas_corretor
ON propostas(corretor_id);

CREATE INDEX idx_propostas_status
ON propostas(status);


-- ===========================================================
-- CONTRATOS
-- ===========================================================

CREATE TABLE contratos (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE SET NULL,

    proposta_id UUID
        REFERENCES propostas(id)
        ON DELETE SET NULL,

    corretor_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    numero TEXT,

    tipo TEXT,

    valor NUMERIC(12,2),

    data_inicio DATE,

    data_fim DATE,

    status TEXT DEFAULT 'rascunho',

    observacoes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_contratos_empresa
ON contratos(empresa_id);

CREATE INDEX idx_contratos_cliente
ON contratos(cliente_id);

CREATE INDEX idx_contratos_imovel
ON contratos(imovel_id);

CREATE INDEX idx_contratos_proposta
ON contratos(proposta_id);

CREATE INDEX idx_contratos_status
ON contratos(status);


-- ===========================================================
-- DOCUMENTOS
-- ===========================================================

CREATE TABLE documentos (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID
        REFERENCES imoveis(id)
        ON DELETE SET NULL,

    contrato_id UUID
        REFERENCES contratos(id)
        ON DELETE SET NULL,

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    nome TEXT NOT NULL,

    tipo TEXT,

    url TEXT NOT NULL,

    tamanho BIGINT,

    mime_type TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    deleted_at TIMESTAMPTZ

);

CREATE INDEX idx_documentos_empresa
ON documentos(empresa_id);

CREATE INDEX idx_documentos_cliente
ON documentos(cliente_id);

CREATE INDEX idx_documentos_imovel
ON documentos(imovel_id);

CREATE INDEX idx_documentos_contrato
ON documentos(contrato_id);

CREATE INDEX idx_documentos_usuario
ON documentos(usuario_id);


-- ===========================================================
-- NOTIFICACOES
-- ===========================================================

CREATE TABLE notificacoes (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    titulo TEXT NOT NULL,

    mensagem TEXT NOT NULL,

    tipo TEXT DEFAULT 'info',

    lida BOOLEAN DEFAULT FALSE,

    link TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_notificacoes_usuario
ON notificacoes(usuario_id);

CREATE INDEX idx_notificacoes_lida
ON notificacoes(lida);


-- ===========================================================
-- LOGS
-- ===========================================================

CREATE TABLE logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE SET NULL,

    usuario_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    acao TEXT NOT NULL,

    tabela TEXT,

    registro_id UUID,

    descricao TEXT,

    ip TEXT,

    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_logs_empresa
ON logs(empresa_id);

CREATE INDEX idx_logs_usuario
ON logs(usuario_id);

CREATE INDEX idx_logs_tabela
ON logs(tabela);

CREATE INDEX idx_logs_registro
ON logs(registro_id);

CREATE INDEX idx_logs_created
ON logs(created_at);


-- ===========================================================
-- PLANOS
-- ===========================================================

CREATE TABLE planos (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome TEXT NOT NULL UNIQUE,

    descricao TEXT,

    preco NUMERIC(12,2) DEFAULT 0,

    periodo TEXT DEFAULT 'mensal',

    limite_usuarios INTEGER,

    limite_imoveis INTEGER,

    limite_clientes INTEGER,

    limite_ai INTEGER,

    recursos JSONB DEFAULT '{}'::jsonb,

    ativo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_planos_ativo
ON planos(ativo);


-- ===========================================================
-- ASSINATURAS
-- ===========================================================

CREATE TABLE assinaturas (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    plano_id UUID NOT NULL
        REFERENCES planos(id)
        ON DELETE RESTRICT,

    stripe_customer_id TEXT,

    stripe_subscription_id TEXT UNIQUE,

    status TEXT DEFAULT 'ativa',

    periodo_inicio TIMESTAMPTZ,

    periodo_fim TIMESTAMPTZ,

    cancelada_em TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_assinaturas_empresa
ON assinaturas(empresa_id);

CREATE INDEX idx_assinaturas_plano
ON assinaturas(plano_id);

CREATE INDEX idx_assinaturas_status
ON assinaturas(status);


-- ===========================================================
-- MATCHS
-- ===========================================================

CREATE TABLE matchs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    cliente_id UUID NOT NULL
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    imovel_id UUID NOT NULL
        REFERENCES imoveis(id)
        ON DELETE CASCADE,

    score NUMERIC(5,2) DEFAULT 0,

    motivo TEXT,

    status TEXT DEFAULT 'novo',

    visualizado BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX idx_matchs_empresa
ON matchs(empresa_id);

CREATE INDEX idx_matchs_cliente
ON matchs(cliente_id);

CREATE INDEX idx_matchs_imovel
ON matchs(imovel_id);

CREATE INDEX idx_matchs_score
ON matchs(score);

CREATE INDEX idx_matchs_status
ON matchs(status);

