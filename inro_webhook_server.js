const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(bodyParser.json());

app.post('/webhook/ig', async (req, res) => {
  const { ig_handle, message, timestamp } = req.body;
  try {
    const { error } = await supabase
      .from('fans')
      .update({
        events: { dm_received: message },
        last_engaged: new Date(timestamp)
      })
      .eq('ig_handle', ig_handle);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Error');
    }
    res.send('Logged IG DM');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
