const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;

// Conexão com o Supabase usando as variáveis de ambiente do Fly.io
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ID fixo para o nosso campeonato na tabela (para simplificar e usar apenas uma linha)
const CAMPEONATO_ID = '00000000-0000-0000-0000-000000000001';

// Rota para buscar o estado atual do campeonato
app.get('/api/campeonato', async (req, res) => {
    let { data, error } = await supabase.from('campeonatos').select('*').eq('id', CAMPEONATO_ID).single();
    if (error && error.code === 'PGRST116') {
        // Se não existir nenhum campeonato iniciado, retorna nulo para o front-end saber que deve exibir a tela de criação
        return res.json(null);
    }
    res.json(data);
});

// Rota para salvar ou atualizar o estado do campeonato
app.post('/api/campeonato', async (req, res) => {
    const estado = { id: CAMPEONATO_ID, ...req.body };
    const { data, error } = await supabase.from('campeonatos').upsert(estado).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Rota para resetar o campeonato
app.post('/api/campeonato/reset', async (req, res) => {
    await supabase.from('campeonatos').delete().eq('id', CAMPEONATO_ID);
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando com Supabase na porta ${PORT}`);
});
