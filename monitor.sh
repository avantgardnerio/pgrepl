kubectl port-forward $(kubectl get pods | pcregrep -o1 "(pgrepl-deployment[^\s]*)") 1099:1099 &
jconsole 127.0.0.1:1099
