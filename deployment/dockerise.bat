ECHO "Building aws-ils-fe version 0.0.1"
docker build -t mitb/aws-ils-fe:0.0.1 .
docker save -o deployment/mitb-aws-ils-fe.tar.gz mitb/aws-ils-fe:0.0.1
